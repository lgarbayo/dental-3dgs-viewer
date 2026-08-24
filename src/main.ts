import { CASOS_VISIBLES, conEncuadre } from './config';
import { Cotas } from './Cotas';
import type { CotasJSON } from './Cotas';
import { Dientes } from './Dientes';
import type { TwinJSON } from './Dientes';
import { PanelTwin } from './PanelTwin';
import { InfoPanel } from './InfoPanel';
import { PanelCapas } from './PanelCapas';
import { SplatViewer } from './SplatViewer';
import './style.css';

function requerir<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Falta el elemento ${selector} en index.html`);
  return el;
}

/**
 * Indice del caso pedido en la URL (?caso=id, o ?caso=N de enlaces antiguos).
 *
 * Se busca por ID antes que por posicion porque la lista visible NO es la misma en
 * desarrollo que en produccion —los casos restringidos caen— y un indice significaria
 * cosas distintas en cada build. El id no se mueve.
 */
function casoInicial(): number {
  const pedido = new URLSearchParams(location.search).get('caso') ?? '';
  const porId = CASOS_VISIBLES.findIndex((c) => c.id === pedido);
  if (porId >= 0) return porId;
  const n = Number(pedido);
  return Number.isInteger(n) && n >= 0 && n < CASOS_VISIBLES.length ? n : 0;
}

async function main(): Promise<void> {
  const raiz = requerir<HTMLDivElement>('#lienzo');
  const cargando = requerir<HTMLDivElement>('#cargando');
  const barra = requerir<HTMLDivElement>('#barra');
  const interfaz = requerir<HTMLDivElement>('#interfaz');
  const selector = requerir<HTMLSelectElement>('#selector-caso');

  if (CASOS_VISIBLES.length === 0) {
    throw new Error('No hay ningun caso publicable: todos estan marcados restringidos.');
  }
  const indice = casoInicial();
  const caso = CASOS_VISIBLES[indice];

  CASOS_VISIBLES.forEach((c, i) => {
    const opcion = document.createElement('option');
    opcion.value = c.id;
    opcion.textContent = c.nombre;
    if (i === indice) opcion.selected = true;
    selector.appendChild(opcion);
  });

  // Cambiar de caso RECARGA la pagina. Recrear el visor de gaussian-splats-3d en
  // caliente deja el worker de ordenacion a medias y la escena no termina de
  // cargar; una recarga limpia es robusta y el .ply queda cacheado por el navegador.
  selector.addEventListener('change', () => {
    location.search = `?caso=${selector.value}`;
  });

  new InfoPanel(caso).montar(interfaz);

  // ⚠️ El sidecar se lee ANTES de montar el visor, y no despues como los paneles. El eje
  // de orbita y el encuadre son argumentos del constructor de `Viewer`: leerlos tarde
  // significaria montar la escena con el eje del mundo escrito a mano y corregirla
  // despues, que es un salto visible y deja el primer arrastre girando mal.
  //
  // Si el caso no trae sidecar, o el sidecar no trae encuadre —no hay escaner etiquetado
  // con que medirlo—, `conEncuadre` devuelve el caso tal cual y manda el `config.ts`.
  let twin: TwinJSON | null = null;
  if (caso.twin) {
    const respuesta = await fetch(caso.twin);
    if (!respuesta.ok) throw new Error(`No se pudo leer ${caso.twin}`);
    twin = (await respuesta.json()) as TwinJSON;
  }
  const encuadrado = conEncuadre(caso, twin?.encuadre);

  const visor = new SplatViewer({
    raiz,
    caso: encuadrado,
    onProgress: (porcentaje) => {
      barra.style.width = `${porcentaje}%`;
    },
  });

  try {
    await visor.cargar();
    cargando.classList.add('oculto');
    // El panel se monta DESPUES de cargar: encender una capa que aun no existe
    // como escena no haria nada y la casilla mentiria.
    if (caso.cotas) {
      const respuesta = await fetch(caso.cotas);
      if (!respuesta.ok) throw new Error(`No se pudo leer ${caso.cotas}`);
      const cotas = new Cotas((await respuesta.json()) as CotasJSON, raiz);
      cotas.seguir(visor.camara);
      window.addEventListener('beforeunload', () => cotas.destruir());
    }
    // Los paneles de la derecha van en UNA columna, no sueltos: `.capas` y `.ficha` se
    // posicionan en fijo/absoluto por su cuenta y se taparian entre si.
    let columna: HTMLDivElement | null = null;
    if (caso.capas || caso.twin) {
      columna = document.createElement('div');
      columna.className = 'columna-twin';
      interfaz.appendChild(columna);
    }
    if (caso.capas) {
      new PanelCapas(caso.capas, (indice, visible) =>
        visor.mostrarCapa(indice, visible),
      ).montar(columna ?? interfaz);
    }
    // Los paneles del gemelo se MONTAN aqui, aunque el sidecar ya se leyo arriba: los
    // centroides se proyectan sobre la camara del visor, y esa camara no existe hasta que
    // la escena esta montada.
    if (twin && columna) {
      const dientes = new Dientes(twin, raiz);
      dientes.montar(columna);
      dientes.seguir(visor.camara);
      new PanelTwin(twin, caso.descargas ?? []).montar(columna);
      window.addEventListener('beforeunload', () => dientes.destruir());
    }
  } catch (error) {
    cargando.innerHTML =
      `<p class="error">No se pudo cargar <code>${caso.ply}</code>.<br>` +
      `<small>${error instanceof Error ? error.message : String(error)}</small></p>`;
    throw error;
  }

  window.addEventListener('beforeunload', () => {
    void visor.destruir();
  });
}

void main();

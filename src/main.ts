import { CASOS } from './config';
import { InfoPanel } from './InfoPanel';
import { SplatViewer } from './SplatViewer';
import './style.css';

function requerir<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Falta el elemento ${selector} en index.html`);
  return el;
}

/** Indice de caso desde la URL (?caso=N), acotado al rango disponible. */
function casoInicial(): number {
  const n = Number(new URLSearchParams(location.search).get('caso'));
  return Number.isInteger(n) && n >= 0 && n < CASOS.length ? n : 0;
}

async function main(): Promise<void> {
  const raiz = requerir<HTMLDivElement>('#lienzo');
  const cargando = requerir<HTMLDivElement>('#cargando');
  const barra = requerir<HTMLDivElement>('#barra');
  const interfaz = requerir<HTMLDivElement>('#interfaz');
  const selector = requerir<HTMLSelectElement>('#selector-caso');

  const indice = casoInicial();
  const caso = CASOS[indice];

  CASOS.forEach((c, i) => {
    const opcion = document.createElement('option');
    opcion.value = String(i);
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

  const visor = new SplatViewer({
    raiz,
    caso,
    onProgress: (porcentaje) => {
      barra.style.width = `${porcentaje}%`;
    },
  });

  try {
    await visor.cargar();
    cargando.classList.add('oculto');
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

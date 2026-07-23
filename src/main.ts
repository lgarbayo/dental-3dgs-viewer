import { CASO } from './config';
import { InfoPanel } from './InfoPanel';
import { SplatViewer } from './SplatViewer';
import './style.css';

function requerir<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Falta el elemento ${selector} en index.html`);
  return el;
}

async function main(): Promise<void> {
  const raiz = requerir<HTMLDivElement>('#lienzo');
  const cargando = requerir<HTMLDivElement>('#cargando');
  const barra = requerir<HTMLDivElement>('#barra');

  new InfoPanel(CASO).montar(requerir<HTMLDivElement>('#interfaz'));

  const visor = new SplatViewer({
    raiz,
    ply: CASO.ply,
    onProgress: (porcentaje) => {
      barra.style.width = `${porcentaje}%`;
    },
  });

  try {
    await visor.cargar();
    cargando.classList.add('oculto');
  } catch (error) {
    cargando.innerHTML =
      `<p class="error">No se pudo cargar <code>${CASO.ply}</code>.<br>` +
      `<small>${error instanceof Error ? error.message : String(error)}</small></p>`;
    throw error;
  }

  window.addEventListener('beforeunload', () => {
    void visor.destruir();
  });
}

void main();

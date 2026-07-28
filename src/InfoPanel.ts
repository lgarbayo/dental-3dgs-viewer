import type { CasoConfig } from './config';

/** A partir de este ancho hay sitio para dejar la ficha abierta de entrada. */
const ANCHO_COMODO = '(min-width: 48rem)';

/**
 * Ficha con los datos del caso, sobre el lienzo.
 *
 * Es un <details> nativo: en movil arranca plegada —solo titulo y caso— para no
 * taparle el modelo al usuario, y en pantallas anchas arranca abierta.
 * `actualizar()` reescribe el contenido al cambiar de caso, conservando si
 * estaba abierta o plegada.
 */
export class InfoPanel {
  private readonly el: HTMLDetailsElement;

  constructor(caso: CasoConfig) {
    this.el = document.createElement('details');
    this.el.className = 'ficha';
    this.el.open = window.matchMedia(ANCHO_COMODO).matches;
    this.el.innerHTML = InfoPanel.plantilla(caso);
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.el);
  }

  actualizar(caso: CasoConfig): void {
    const abierta = this.el.open;
    this.el.innerHTML = InfoPanel.plantilla(caso);
    this.el.open = abierta;
  }

  private static plantilla(caso: CasoConfig): string {
    const { id, arcada, primitivas, psnrRetenidas, vistasEntrenamiento,
            vistasRetenidas, iteraciones, nota, creditos } = caso;
    const fmt = (n: number) => n.toLocaleString('es-ES');
    return `
      <summary>
        <span class="cabecera">
          <span class="titulo">3D Gaussian Splatting dental</span>
          <span class="caso">Caso <code>${id}_${arcada}</code></span>
        </span>
        <span class="flecha" aria-hidden="true"></span>
      </summary>
      <div class="cuerpo">
        <dl>
          <div><dt>Gaussianas</dt><dd>${fmt(primitivas)}</dd></div>
          <div><dt>PSNR en vistas retenidas</dt><dd>${psnrRetenidas.toFixed(2)} dB</dd></div>
          <div><dt>Vistas</dt><dd>${fmt(vistasEntrenamiento)} entren. · ${fmt(vistasRetenidas)} retenidas</dd></div>
          <div><dt>Iteraciones</dt><dd>${fmt(iteraciones)}</dd></div>
        </dl>
        <p class="nota">
          El campo se entrena contra vistas sintéticas renderizadas desde la malla,
          con pose conocida. Valida el <em>motor</em> de 3DGS, no un pipeline
          foto&rarr;3D con imágenes clínicas.
        </p>
        <p class="nota">${nota}</p>
        <p class="creditos">${creditos}</p>
        <p class="controles">arrastrar: rotar · rueda: zoom · clic derecho: desplazar</p>
      </div>
    `;
  }
}

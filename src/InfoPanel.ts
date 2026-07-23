import type { CasoConfig } from './config';

/** A partir de este ancho hay sitio para dejar la ficha abierta de entrada. */
const ANCHO_COMODO = '(min-width: 48rem)';

/**
 * Ficha con los datos del caso, sobre el lienzo.
 *
 * Es un <details> nativo: en movil arranca plegada —solo titulo y caso— para no
 * taparle el modelo al usuario, y en pantallas anchas arranca abierta.
 */
export class InfoPanel {
  private readonly el: HTMLDetailsElement;

  constructor(private readonly caso: CasoConfig) {
    this.el = document.createElement('details');
    this.el.className = 'ficha';
    this.el.innerHTML = this.plantilla();
    this.el.open = window.matchMedia(ANCHO_COMODO).matches;
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.el);
  }

  private plantilla(): string {
    const { id, arcada, primitivas, psnrRetenidas, vistasEntrenamiento,
            vistasRetenidas, iteraciones } = this.caso;
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
          <div><dt>Vistas</dt><dd>${fmt(vistasEntrenamiento)} entren. · ${vistasRetenidas} retenidas</dd></div>
          <div><dt>Iteraciones</dt><dd>${fmt(iteraciones)}</dd></div>
        </dl>
        <p class="nota">
          El campo se entrena contra vistas sintéticas renderizadas desde la malla,
          con pose conocida. Valida el <em>motor</em> de 3DGS, no un pipeline
          foto&rarr;3D con imágenes clínicas.
        </p>
        <p class="nota">
          Receta completa: pérdida <code>0,8·L1 + 0,2·(1−SSIM)</code>, densificación
          y poda, y armónicos esféricos de grado 2 — por eso el brillo cambia al
          girar. Frente a «L1 sola, sin densificar, sin armónicos», eso sube el
          PSNR de 22,6 a 32,5 dB.
        </p>
        <p class="creditos">
          Datos: Teeth3DS+ (Ben-Hamadou et al., MICCAI 3DTeethSeg'22), CC-BY 4.0.
        </p>
        <p class="controles">arrastrar: rotar · rueda: zoom · clic derecho: desplazar</p>
      </div>
    `;
  }
}

import type { CasoConfig } from './config';

/** Ficha con los datos del caso y una nota de alcance, sobre el canvas. */
export class InfoPanel {
  private readonly el: HTMLElement;

  constructor(private readonly caso: CasoConfig) {
    this.el = document.createElement('aside');
    this.el.className = 'ficha';
    this.el.innerHTML = this.plantilla();
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.el);
  }

  private plantilla(): string {
    const { id, arcada, primitivas, psnrRetenidas, vistasEntrenamiento,
            vistasRetenidas, iteraciones } = this.caso;
    const fmt = (n: number) => n.toLocaleString('es-ES');
    return `
      <h1>3D Gaussian Splatting dental</h1>
      <p class="caso">Caso <code>${id}_${arcada}</code></p>
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
    `;
  }
}

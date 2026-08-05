import type { CapaConfig } from './config';

/** Rango de Hounsfield legible: `[1250, 2000)` o `≥ 2000`. */
function rangoHU(hu: readonly [number | null, number | null]): string {
  const [lo, hi] = hu;
  if (lo === null) return `< ${hi} HU`;
  if (hi === null) return `≥ ${lo} HU`;
  return `${lo}–${hi} HU`;
}

/**
 * Casillas para encender y apagar capas de densidad.
 *
 * Cada casilla es un campo gaussiano independiente ya cargado en el visor: no
 * recarga nada, solo cambia la visibilidad de su escena. Las capas son
 * disjuntas, asi que encender varias SUMA atenuacion — que es exactamente lo
 * que hace una radiografia.
 */
export class PanelCapas {
  private readonly el: HTMLElement;

  constructor(
    capas: readonly CapaConfig[],
    private readonly alCambiar: (indice: number, visible: boolean) => void,
  ) {
    this.el = document.createElement('details');
    this.el.className = 'capas';
    (this.el as HTMLDetailsElement).open = true;
    this.el.innerHTML = `
      <summary>Capas de densidad</summary>
      <div class="cuerpo">
        ${capas
          .map(
            (c, i) => `
          <label class="capa">
            <input type="checkbox" data-indice="${i}" ${c.encendida ? 'checked' : ''} />
            <span class="muestra" style="background:${c.color}"></span>
            <span class="etiqueta">${c.nombre}<small>${rangoHU(c.hu)}</small></span>
          </label>`,
          )
          .join('')}
        <p class="aviso">
          Falso color y opacidad reescalada: el CBCT mide atenuación, no color.
          El artefacto conserva <code>color_superficie = None</code>.
        </p>
      </div>`;

    this.el.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach((casilla) => {
      casilla.addEventListener('change', () => {
        this.alCambiar(Number(casilla.dataset.indice), casilla.checked);
      });
    });
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.el);
  }
}

import type { TwinJSON } from './Dientes';

/** Un fichero descargable del caso, con su error de ida y vuelta medido. */
export interface Descarga {
  readonly nombre: string;
  readonly fichero: string;
  readonly que_es: string;
  /** Desviacion maxima al releer lo que se escribio. `null` = no se verifico. */
  readonly desviacion_mm: number | null;
}

/**
 * Lo que el gemelo sabe y el modelo 3D no puede enseñar: medidas no regionales,
 * motivos de revisión humana, el recorte de la vista y los ficheros reversibles.
 *
 * **Por qué el gate va aquí y no escondido.** Es lo único que un clínico no puede deducir
 * mirando la geometría. Un twin que se ve perfecto y llevaba un registro sin converger
 * parece más firme de lo que es, y esa diferencia es exactamente la que el pipeline mide.
 *
 * **Y por qué la descarga lleva su desviación al lado.** El pipeline mide la
 * reversibilidad de cada fichero —hoy 0,000000 mm en el STL y en el PLY del twin— y hasta
 * ahora ese número no lo veía nadie. Un botón que dice «exportar» sin decir cuánto se
 * pierde al hacerlo no es reversibilidad, es una promesa.
 */
export class PanelTwin {
  private readonly el: HTMLDetailsElement;

  constructor(
    private readonly datos: TwinJSON,
    private readonly descargas: readonly Descarga[] = [],
  ) {
    this.el = document.createElement('details');
    this.el.className = 'ficha ficha-twin';
    this.el.open = window.matchMedia('(min-width: 48rem)').matches;
    this.el.innerHTML = this.plantilla();
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.el);
  }

  private plantilla(): string {
    const d = this.datos;
    const r = d.recorte;
    const fmt = (n: number) => n.toLocaleString('es-ES');

    const medidas = d.medidas.length
      ? d.medidas
          .map((m) => {
            const rango =
              m.min !== null && m.max !== null
                ? `${m.min}–${m.max}`
                : 'sin rango declarado';
            const clase = m.fuera === true ? ' class="mal"' : '';
            const lado = m.lado ? ` (${m.lado})` : '';
            return `<div><dt>${m.nombre}${lado}</dt><dd${clase}>${m.valor}${m.unidad}
              <span class="rango">${rango}</span></dd></div>`;
          })
          .join('')
      : '<div><dd class="vacio">Ningún informe aportó medidas de este tipo.</dd></div>';

    const gate = d.gate.length
      ? d.gate.map((m) => `<li>${m}</li>`).join('')
      : '<li class="vacio">El caso pasaría sin revisión humana.</li>';

    const descargas = this.descargas
      .map((x) => {
        const err =
          x.desviacion_mm === null
            ? '<span class="rango">sin verificar</span>'
            : `<span class="rango">±${x.desviacion_mm.toFixed(6)} mm</span>`;
        return `<li><a href="${x.fichero}" download>${x.nombre}</a> ${err}
          <small>${x.que_es}</small></li>`;
      })
      .join('');

    return `
      <summary>
        <span class="cabecera">
          <span class="titulo">Gemelo digital</span>
          <span class="caso">${d.acquisition_id}</span>
        </span>
        <span class="flecha" aria-hidden="true"></span>
      </summary>
      <div class="cuerpo">
        <h3>Medidas no regionales</h3>
        <dl>${medidas}</dl>

        <h3>Revisión humana</h3>
        <ul class="gate">${gate}</ul>

        ${descargas ? `<h3>Exportar</h3><ul class="descargas">${descargas}</ul>` : ''}

        <h3>Qué estás viendo</h3>
        <dl>
          <div><dt>dientes</dt><dd>${fmt(r.dientes)} / ${fmt(r.dientes_total)}
            <span class="rango">enteros</span></dd></div>
          <div><dt>encía</dt><dd>${fmt(r.encia)} / ${fmt(r.encia_total)}</dd></div>
          <div><dt>resto del campo</dt><dd>${fmt(r.resto)} / ${fmt(r.resto_total)}</dd></div>
        </dl>
        <p class="nota">
          Los dientes entran completos: son lo único que se mira. El resto es hueso y
          cráneo —el FOV es de cabeza entera— y una muestra uniforme los habría dejado
          casi vacíos.
        </p>
        <p class="nota aviso">
          <strong>Esto no es el gemelo, es una vista de él.</strong>
          La opacidad sale de <code>${String(d.display.opacity)}</code> y el color es
          falso: un CBCT no mide color. ${d.reversibilidad.aviso}
        </p>
        <p class="creditos">
          contrato <code>${d.schema}</code> · perfil del twin
          <code>${d.perfil_twin}</code> · este .ply <code>${d.perfil_ply}</code>
        </p>
      </div>
    `;
  }
}

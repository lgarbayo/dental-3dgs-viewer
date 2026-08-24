import { Vector3 } from 'three';
import type { Camera } from 'three';

/** Un valor del informe que el contrato NO interpreta (indice de oclusion, carga…). */
export interface Medida {
  readonly nombre: string;
  readonly valor: number;
  readonly unidad: string;
  readonly lado: string | null;
  readonly min: number | null;
  readonly max: number | null;
  /** `null` = el informe no declaro rango. NO es lo mismo que «esta bien». */
  readonly fuera: boolean | null;
}

/** Lo que la GEOMETRIA dice de una pieza: cuanto aporta cada fuente y hasta donde llega. */
export interface Geometria {
  readonly corona: number;
  readonly raiz: number;
  readonly altura_mm: number;
  readonly veredicto: string;
}

/** Lo que se sabe de una pieza. Todos los campos son opcionales a proposito. */
export interface Diente {
  readonly fdi: string;
  readonly hallazgos: readonly string[];
  readonly confianza?: number;
  readonly fuente?: string;
  readonly ph?: number;
  readonly n_raices?: number;
  readonly n_conductos?: number;
  readonly geometria?: Geometria;
  /** Si el informe la menciona / si la segmentacion la encontro. Pueden no coincidir. */
  readonly en_informe?: boolean;
  readonly segmentado?: boolean;
  /** Motivos de revision que hablan DE ESTA pieza. */
  readonly gate?: readonly string[];
}

/** El sidecar que acompaña al .ply del twin. Lo emite `viewer-export-agent`. */
/**
 * Encuadre y eje de orbita MEDIDOS sobre los ejes anatomicos de la arcada.
 *
 * Lo emite `viewer-export-agent` a partir de las etiquetas FDI del escaner, no de los
 * ejes del fichero. Es opcional porque un caso sin escaner etiquetado no lo trae: ahi el
 * `config.ts` se queda con lo que tenga escrito a mano, y el gate lo dice.
 */
export interface EncuadreJSON {
  readonly centro: readonly [number, number, number];
  /**
   * Eje de ORBITA: la direccion SUPERIOR, hacia la coronilla. Ver `CasoConfig.arriba`.
   *
   * ⚠️ **No es el oclusal**, y confundirlos pone la cabeza boca abajo. El oclusal va de la
   * encia a las coronas: en un maxilar las coronas cuelgan hacia abajo, asi que apunta a
   * inferior y una arcada superior se ve exactamente como una inferior. Paso.
   */
  readonly arriba: readonly [number, number, number];
  readonly direccion: readonly [number, number, number];
  readonly distancia: number;
  /** Campo vertical con el que se calculo `distancia`. Con otro no encuadra. */
  readonly fov_grados: number;
  /** Cual de las dos, deducido del CUADRANTE de las piezas etiquetadas. */
  readonly arcada: 'upper' | 'lower';
  readonly ejes: {
    readonly oclusal: readonly [number, number, number];
    readonly superior: readonly [number, number, number];
    readonly derecha: readonly [number, number, number];
    readonly anterior: readonly [number, number, number];
  };
  readonly medido: string;
}

export interface TwinJSON {
  readonly acquisition_id: string;
  readonly schema: string;
  readonly perfil_twin: string;
  readonly perfil_ply: string;
  readonly display: Readonly<Record<string, unknown>>;
  readonly recorte: Readonly<Record<string, number>>;
  /** FDI → centro de masas de la pieza, en el espacio del campo. */
  readonly centroides: Readonly<Record<string, readonly [number, number, number]>>;
  readonly dientes: Readonly<Record<string, Diente>>;
  readonly medidas: readonly Medida[];
  readonly gate: readonly string[];
  readonly reversibilidad: { readonly aviso: string };
  /** Ausente si el caso no trae escaner etiquetado con que medirlo. */
  readonly encuadre?: EncuadreJSON;
}

/** A menos de esta fraccion de la pantalla, un clic cuenta como «ese diente». */
const RADIO_CLIC = 0.06;

/**
 * Selección por pieza, y la ficha clínica de la pieza seleccionada.
 *
 * **Por qué esto y no un raycast contra los splats.** No hace falta: el sidecar trae el
 * centroide de cada diente, así que son catorce puntos y no 246.000. Se proyectan sobre la
 * cámara —el mismo mecanismo que ya usa `Cotas`— y gana el más cercano al clic. Barato,
 * sin tocar el rasterizador, y sin volver a parsear el .ply en el navegador.
 *
 * **Y por qué la ficha va delante.** Un visor de splats enseña splats; Slicer enseña
 * geometría. Ninguno de los dos enseña *este diente es el 36, el informe dice que tiene
 * caries y la pose que lo puso ahí tiene confianza 0,55*. Esa capa es la aportación del
 * pipeline, así que se pone delante en vez de esconderla detrás del modelo.
 *
 * ⚠️ **Un diente segmentado puede no tener informe, y al revés.** No se rellena el hueco:
 * se dice cuál de los dos falta. Que no coincidan es información clínica —el gate ya lo
 * declara pieza a pieza— y taparlo con un «sin datos» genérico la perdería.
 */
export class Dientes {
  private readonly caja: HTMLDivElement;
  private readonly svg: SVGSVGElement;
  private readonly marcas = new Map<string, SVGCircleElement>();
  private seleccionado: string | null = null;
  private animacion = 0;

  constructor(
    private readonly datos: TwinJSON,
    private readonly raiz: HTMLElement,
  ) {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('class', 'dientes-marcas');
    for (const fdi of Object.keys(datos.centroides)) {
      const marca = document.createElementNS(ns, 'circle');
      marca.setAttribute('class', 'diente-marca');
      marca.setAttribute('r', '5');
      this.svg.appendChild(marca);
      this.marcas.set(fdi, marca);
    }
    raiz.appendChild(this.svg);

    this.caja = document.createElement('div');
    this.caja.className = 'ficha-diente';
    this.pinta(null);

    raiz.addEventListener('click', (e) => this.alHacerClic(e));
  }

  montar(padre: HTMLElement): void {
    padre.appendChild(this.caja);
  }

  /** Sigue a la camara: reproyecta los centroides en cada fotograma. */
  seguir(camara: Camera): void {
    const paso = (): void => {
      const r = this.raiz.getBoundingClientRect();
      this.svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
      for (const [fdi, marca] of this.marcas) {
        const p = this.aPantalla(fdi, camara, r);
        const visible = p !== null;
        marca.setAttribute('opacity', visible ? (fdi === this.seleccionado ? '1' : '0.45') : '0');
        if (p) {
          marca.setAttribute('cx', String(p.x));
          marca.setAttribute('cy', String(p.y));
        }
        marca.classList.toggle('activa', fdi === this.seleccionado);
      }
      this.animacion = requestAnimationFrame(paso);
    };
    paso();
  }

  destruir(): void {
    cancelAnimationFrame(this.animacion);
    this.svg.remove();
    this.caja.remove();
  }

  private aPantalla(
    fdi: string,
    camara: Camera,
    r: DOMRect,
  ): { x: number; y: number } | null {
    const c = this.datos.centroides[fdi];
    const v = new Vector3(c[0], c[1], c[2]).project(camara);
    // z fuera de [-1,1] es detras de la camara: proyectarlo daria un punto espejado.
    if (v.z < -1 || v.z > 1) return null;
    return { x: ((v.x + 1) / 2) * r.width, y: ((1 - v.y) / 2) * r.height };
  }

  private alHacerClic(e: MouseEvent): void {
    const r = this.raiz.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    const limite = RADIO_CLIC * Math.min(r.width, r.height);
    let mejor: string | null = null;
    let dmin = limite * limite;

    for (const fdi of this.marcas.keys()) {
      const marca = this.marcas.get(fdi);
      if (marca?.getAttribute('opacity') === '0') continue;
      const p = { x: Number(marca?.getAttribute('cx')), y: Number(marca?.getAttribute('cy')) };
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < dmin) {
        dmin = d;
        mejor = fdi;
      }
    }
    this.seleccionado = mejor;
    this.pinta(mejor);
  }

  private pinta(fdi: string | null): void {
    if (fdi === null) {
      const n = Object.keys(this.datos.centroides).length;
      this.caja.innerHTML =
        `<h3>Pieza</h3><p class="vacio">Pincha uno de los ${n} dientes segmentados.</p>`;
      return;
    }
    const d = this.datos.dientes[fdi];
    if (!d) {
      this.caja.innerHTML =
        `<h3>Pieza ${fdi}</h3><p class="vacio">Ni el informe ni la segmentación ` +
        `dicen nada de esta pieza.</p>`;
      return;
    }

    // Lo que dice el INFORME. Puede no decir nada: un informe de CBCT trae anatomía
    // radicular y hallazgos, y el pH solo si alguien lo midió.
    const informe: string[] = [];
    if (d.ph !== undefined) informe.push(fila('pH', String(d.ph)));
    if (d.n_raices !== undefined) informe.push(fila('raíces', String(d.n_raices)));
    if (d.n_conductos !== undefined) informe.push(fila('conductos', String(d.n_conductos)));
    if (d.confianza !== undefined) {
      const bajo = d.confianza < 0.7 ? ' class="mal"' : '';
      informe.push(`<div><dt>confianza</dt><dd${bajo}>${d.confianza}</dd></div>`);
    }
    if (d.fuente) informe.push(fila('fuente', `<code>${esc(d.fuente)}</code>`));

    // Lo que dice la GEOMETRÍA: cuánto aporta cada fuente y hasta dónde llega.
    const g = d.geometria;
    const geo = g
      ? fila('corona (escáner)', `${g.corona.toLocaleString('es-ES')}`) +
        fila('raíz (CBCT)', `${g.raiz.toLocaleString('es-ES')}`) +
        `<div><dt>altura</dt><dd${g.altura_mm > 26 ? ' class="mal"' : ''}>` +
        `${g.altura_mm} mm <span class="rango">${esc(g.veredicto)}</span></dd></div>`
      : '';

    const chips = d.hallazgos.length
      ? `<p class="chips">${d.hallazgos.map((h) => `<span>${esc(h)}</span>`).join('')}</p>`
      : '';

    // Los motivos de revisión DE ESTA pieza. Estaban solo en la lista global, donde no
    // los ve quien pincha un diente.
    const gate = d.gate?.length
      ? `<h4>Revisión</h4><ul class="gate">` +
        d.gate.map((m) => `<li>${esc(m)}</li>`).join('') + `</ul>`
      : '';

    // Que el informe y la segmentación no coincidan es información clínica, no un hueco.
    const desacuerdo =
      d.en_informe && !d.segmentado
        ? '<p class="aviso-pieza">El informe la menciona y la segmentación no la encontró.</p>'
        : !d.en_informe && d.segmentado
          ? '<p class="aviso-pieza">Segmentada, pero el informe no dice nada de ella.</p>'
          : '';

    this.caja.innerHTML =
      `<h3>Pieza ${fdi}</h3>` + desacuerdo +
      (informe.length ? `<h4>Informe</h4><dl>${informe.join('')}</dl>${chips}` : '') +
      (geo ? `<h4>Geometría</h4><dl>${geo}</dl>` : '') +
      gate;
  }
}

/** Escapa texto que viene del sidecar antes de meterlo en `innerHTML`.
 *
 * El sidecar lo escribe un agente nuestro, pero su contenido sale de un informe clinico
 * de un tercero: los hallazgos y los motivos del gate son texto libre que nadie ha
 * revisado. Interpolarlo sin escapar seria confiar en el PDF de un proveedor.
 */
const ESCAPES: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
};
function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ESCAPES[c]);
}

function fila(k: string, v: string): string {
  return `<div><dt>${k}</dt><dd>${v}</dd></div>`;
}

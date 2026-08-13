import { Vector3 } from 'three';
import type { Camera } from 'three';

/** Una cota: dos puntos en el espacio del campo y su valor en milimetros. */
export interface Cota {
  readonly a: readonly [number, number, number];
  readonly b: readonly [number, number, number];
  readonly mm: number;
}

export interface CotasJSON {
  readonly unidad: string;
  readonly que_mide: string;
  readonly residuo_registro_mm: number;
  readonly cotas: readonly Cota[];
}

/**
 * Dibuja las medidas EN MILIMETROS sobre la anatomia, como en una radiografia
 * anotada: un segmento entre los dos puntos y la cifra al lado.
 *
 * Va en SVG proyectado y no como geometria de three.js, por dos motivos. Una cota
 * es una ANOTACION: tiene que verse siempre, tambien cuando el punto queda detras
 * de la superficie, y en 3D habria que pelearse con la profundidad — ya paso en
 * `altura_corona.py`, donde la cota dibujada sobre la malla quedaba enterrada y hubo
 * que separarla 3 mm. Y el texto en SVG es nitido a cualquier zoom, mientras que un
 * sprite se pixela.
 *
 * El campo gaussiano NO se toca: el color del .ply es marfil plano, igual que el
 * resto de casos sin color fotometrico. La medida la lleva la cota, no el color.
 */
export class Cotas {
  private readonly svg: SVGSVGElement;
  private readonly lineas: SVGLineElement[] = [];
  private readonly puntos: SVGCircleElement[] = [];
  private readonly textos: SVGTextElement[] = [];
  private animacion = 0;
  private visible = true;

  constructor(
    private readonly datos: CotasJSON,
    private readonly raiz: HTMLElement,
  ) {
    const ns = 'http://www.w3.org/2000/svg';
    this.svg = document.createElementNS(ns, 'svg');
    this.svg.setAttribute('class', 'cotas');

    for (const cota of datos.cotas) {
      const linea = document.createElementNS(ns, 'line');
      linea.setAttribute('class', 'cota-linea');
      this.svg.appendChild(linea);
      this.lineas.push(linea);

      for (const _ of [0, 1]) {
        const punto = document.createElementNS(ns, 'circle');
        punto.setAttribute('r', '3.5');
        punto.setAttribute('class', 'cota-punto');
        this.svg.appendChild(punto);
        this.puntos.push(punto);
      }

      const texto = document.createElementNS(ns, 'text');
      texto.setAttribute('class', 'cota-texto');
      // Con signo: el sentido es la mitad de la informacion. Un +0,4 y un -0,4 son
      // cosas distintas y sin el signo se leerian igual.
      texto.textContent = `${cota.mm > 0 ? '+' : ''}${cota.mm.toFixed(1)}`;
      this.svg.appendChild(texto);
      this.textos.push(texto);
    }
    raiz.appendChild(this.svg);
  }

  /** Arranca el bucle que reproyecta las cotas en cada fotograma. */
  seguir(camara: Camera): void {
    const v = new Vector3();
    const paso = (): void => {
      this.animacion = requestAnimationFrame(paso);
      if (!this.visible) return;
      const ancho = this.raiz.clientWidth;
      const alto = this.raiz.clientHeight;
      this.svg.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);

      this.datos.cotas.forEach((cota, i) => {
        const pa = proyectar(v.set(...cota.a), camara, ancho, alto);
        const pb = proyectar(v.set(...cota.b), camara, ancho, alto);
        // `null` = el punto queda detras de la camara: se esconde en vez de
        // dibujarse en un sitio inventado (la proyeccion se invierte detras).
        const oculta = pa === null || pb === null;
        this.lineas[i].style.display = oculta ? 'none' : '';
        this.textos[i].style.display = oculta ? 'none' : '';
        this.puntos[2 * i].style.display = oculta ? 'none' : '';
        this.puntos[2 * i + 1].style.display = oculta ? 'none' : '';
        if (oculta) return;

        this.lineas[i].setAttribute('x1', String(pa[0]));
        this.lineas[i].setAttribute('y1', String(pa[1]));
        this.lineas[i].setAttribute('x2', String(pb[0]));
        this.lineas[i].setAttribute('y2', String(pb[1]));
        this.puntos[2 * i].setAttribute('cx', String(pa[0]));
        this.puntos[2 * i].setAttribute('cy', String(pa[1]));
        this.puntos[2 * i + 1].setAttribute('cx', String(pb[0]));
        this.puntos[2 * i + 1].setAttribute('cy', String(pb[1]));
        this.textos[i].setAttribute('x', String(Math.max(pa[0], pb[0]) + 8));
        this.textos[i].setAttribute('y', String((pa[1] + pb[1]) / 2 + 4));
      });
    };
    paso();
  }

  mostrar(visible: boolean): void {
    this.visible = visible;
    this.svg.style.display = visible ? '' : 'none';
  }

  destruir(): void {
    cancelAnimationFrame(this.animacion);
    this.svg.remove();
  }
}

/** Punto del mundo → pixeles de pantalla, o `null` si queda detras de la camara. */
function proyectar(
  punto: Vector3,
  camara: Camera,
  ancho: number,
  alto: number,
): [number, number] | null {
  const p = punto.clone().project(camara);
  if (p.z > 1) return null;
  return [((p.x + 1) / 2) * ancho, ((1 - p.y) / 2) * alto];
}

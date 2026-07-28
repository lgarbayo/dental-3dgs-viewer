import type { Vec3 } from '@mkkellogg/gaussian-splats-3d';

/**
 * Metadatos y encuadre de un caso. Cada caso trae SU propio grado de armonicos y
 * su encuadre de camara, porque conviven campos en espacios distintos:
 *  - Teeth3DS+ conserva coordenadas en mm (no centrado) y color con armonicos.
 *  - Bite2Text esta normalizado a caja unidad y su color es RGB plano (grado 0).
 */
export interface CasoConfig {
  readonly id: string;
  /** Etiqueta para el desplegable. */
  readonly nombre: string;
  readonly arcada: 'upper' | 'lower';
  readonly ply: string;
  /** Gaussianas del campo entrenado. */
  readonly primitivas: number;
  /** PSNR medio sobre las vistas retenidas, en dB. */
  readonly psnrRetenidas: number;
  readonly vistasEntrenamiento: number;
  readonly vistasRetenidas: number;
  readonly iteraciones: number;
  /** Grado de armonicos esfericos del ply (0 = color RGB plano, sin f_rest). */
  readonly shGrado: 0 | 1 | 2;
  /** Encuadre de camara, en el espacio de coordenadas del propio campo. */
  readonly centro: Vec3;
  readonly arriba: Vec3;
  readonly direccionCamara: Vec3;
  readonly distanciaBase: number;
  /** Umbral de alfa (0-255) por debajo del cual se descarta un splat. */
  readonly umbralAlfa: number;
  /** Nota de receta y creditos de datos, propios de cada caso. */
  readonly nota: string;
  readonly creditos: string;
}

export const CASOS: CasoConfig[] = [
  {
    id: '01A6GW4A',
    nombre: 'Teeth3DS+ · 01A6GW4A (inferior)',
    arcada: 'lower',
    ply: 'trained_3dgs.ply',
    primitivas: 147_267,
    psnrRetenidas: 32.49,
    vistasEntrenamiento: 462,
    vistasRetenidas: 66,
    iteraciones: 9_000,
    shGrado: 2,
    // El campo conserva las coordenadas en mm de la malla (centroide ~[2,-0.6,-90.9]).
    centro: [1.3, 16.3, -106.5],
    arriba: [0, 1, 0],
    direccionCamara: [0, 0.6225, 0.7825],
    distanciaBase: 164,
    umbralAlfa: 5,
    nota:
      'Receta de referencia: pérdida 0,8·L1 + 0,2·(1−SSIM), densificación y poda, ' +
      'y armónicos esféricos de grado 2 — por eso el brillo cambia al girar.',
    creditos: "Datos: Teeth3DS+ (Ben-Hamadou et al., MICCAI 3DTeethSeg'22), CC-BY 4.0.",
  },
  {
    id: 'F1980',
    nombre: 'Bite2Text · F1980 (inferior)',
    arcada: 'lower',
    ply: 'bite2text_f1980_lower.ply',
    primitivas: 142_805,
    psnrRetenidas: 29.60,
    vistasEntrenamiento: 1_200,
    vistasRetenidas: 400,
    iteraciones: 6_000,
    shGrado: 0,
    // Campo normalizado a caja unidad, centrado en el origen; el eje vertical de
    // la arcada es z (asi salio la orbita de render). Ajustar en vivo si hiciera falta.
    centro: [0, 0, 0],
    arriba: [0, 0, 1],
    direccionCamara: [0.9, 0, 0.42],
    distanciaBase: 3.5,
    // Campo entrenado sin regularizacion de opacidad: la mediana es ~0,01, asi
    // que el umbral 5/255 del otro caso se cargaria el 69% de las gaussianas y
    // no se veria nada. Aqui NO se poda (se componen todas, como en el render gsplat).
    umbralAlfa: 0,
    nota:
      'Escáner STL pelado → 1600 vistas Blender (EEVEE) a 1024 px → gsplat, ' +
      'pérdida 0,8·L1 + 0,2·(1−SSIM) — la SSIM afila los bordes de los dientes. ' +
      'Sin armónicos (color RGB plano, grado 0): el color no cambia al girar.',
    creditos: 'Datos: Bite2Text (UNIMORE / Univ. Ferrara), CC-BY-SA 4.0 — derivado bajo la misma licencia.',
  },
];

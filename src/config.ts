import type { Vec3 } from '@mkkellogg/gaussian-splats-3d';

/** Metadatos del caso que se muestra. Salen del notebook 04 de dental-3dgs-lab. */
export interface CasoConfig {
  readonly id: string;
  readonly arcada: 'upper' | 'lower';
  readonly ply: string;
  /** Gaussianas del campo entrenado. */
  readonly primitivas: number;
  /** PSNR medio sobre las vistas retenidas, en dB. */
  readonly psnrRetenidas: number;
  /** Vistas de entrenamiento / retenidas. */
  readonly vistasEntrenamiento: number;
  readonly vistasRetenidas: number;
  readonly iteraciones: number;
}

export const CASO: CasoConfig = {
  id: '01A6GW4A',
  arcada: 'lower',
  ply: 'trained_3dgs.ply',
  primitivas: 147_267,
  psnrRetenidas: 32.49,
  vistasEntrenamiento: 462,
  vistasRetenidas: 66,
  iteraciones: 9_000,
};

/**
 * Encuadre de camara.
 *
 * La escena viene en milimetros y NO esta centrada en el origen: el campo
 * entrenado conserva las coordenadas de la malla original (centroide en
 * ~[2, -0.6, -90.9], unos 87 x 68 x 43 mm). El azimut 0 del notebook 03 mira
 * desde +Z, asi que la camara se coloca al frente y elevada.
 */
/**
 * Centro y distancia se calculan sobre las gaussianas "de masa" (opacas y de
 * menos de 5 mm), no sobre todas: el entrenamiento no poda, asi que quedan
 * gaussianas enormes y casi transparentes que desplazan el centroide y
 * dejarian la arcada descentrada y pequena en el encuadre.
 */
export const CENTRO: Vec3 = [1.3, 16.3, -106.5];
export const CAMARA_INICIAL: Vec3 = [1.3, 118.2, 21.6];
export const ARRIBA: Vec3 = [0, 1, 0];

/** Umbral de alfa (0-255) por debajo del cual se descarta un splat. */
export const UMBRAL_ALFA = 5;

/**
 * Grado de armonicos esfericos del campo. El ply trae 9 coeficientes por canal
 * (f_dc + 8 f_rest); cargarlo como grado 0 tiraria la dependencia del color con
 * la direccion de vista, que es justo lo que reproduce el brillo especular.
 */
export const SH_GRADO = 2;

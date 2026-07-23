import { SceneFormat, Viewer } from '@mkkellogg/gaussian-splats-3d';
import type { Vec3 } from '@mkkellogg/gaussian-splats-3d';

import { ARRIBA, CENTRO, DIRECCION_CAMARA, DISTANCIA_BASE, SH_GRADO, UMBRAL_ALFA }
  from './config';

/**
 * Aleja la camara en ventanas verticales.
 *
 * Con FOV vertical fijo, el campo horizontal se estrecha segun el aspecto: en un
 * movil en vertical (aspecto ~0,46) la arcada se salia por los lados. Encuadrar
 * en ancho exige multiplicar la distancia por 1/aspecto.
 */
function posicionCamara(): Vec3 {
  const aspecto = window.innerWidth / window.innerHeight;
  const distancia = DISTANCIA_BASE * Math.max(1, 1 / aspecto);
  return [
    CENTRO[0] + DIRECCION_CAMARA[0] * distancia,
    CENTRO[1] + DIRECCION_CAMARA[1] * distancia,
    CENTRO[2] + DIRECCION_CAMARA[2] * distancia,
  ];
}


export interface SplatViewerOptions {
  /** Contenedor donde se monta el canvas. */
  raiz: HTMLElement;
  /** Ruta del .ply en formato 3DGS estandar. */
  ply: string;
  onProgress?: (porcentaje: number, mensaje: string) => void;
}

/**
 * Envuelve el visor de gaussian-splats-3d con el encuadre de este caso.
 *
 * Carga el PLY *completo* (posicion, escala, rotacion, opacidad y color como
 * coeficiente DC de armonicos esfericos). Un PLY de solo posicion+color se
 * veria como una nube de puntos, no como un campo de gaussianas.
 */
export class SplatViewer {
  private viewer: Viewer | null = null;
  private readonly opciones: SplatViewerOptions;

  constructor(opciones: SplatViewerOptions) {
    this.opciones = opciones;
  }

  async cargar(): Promise<void> {
    // El worker de ordenacion usa SharedArrayBuffer, que solo existe si la
    // pagina esta cross-origin isolated (cabeceras COOP/COEP). Vite las pone en
    // local, pero un host estatico como GitHub Pages no puede. Se detecta en
    // ejecucion y se cae al camino sin memoria compartida, que funciona en
    // cualquier sitio: sin esto la escena no llega a cargar.
    const aislado = globalThis.crossOriginIsolated === true;

    const viewer = new Viewer({
      rootElement: this.opciones.raiz,
      cameraUp: ARRIBA,
      initialCameraPosition: posicionCamara(),
      initialCameraLookAt: CENTRO,
      sphericalHarmonicsDegree: SH_GRADO,
      useBuiltInControls: true,
      antialiased: true,
      sharedMemoryForWorkers: aislado,
      // gpuAcceleratedSort ROMPE el render: con el aislamiento activo (el caso
      // de `npm run dev`) la escena carga sin errores pero no se dibuja nada.
      // Medido: shared=1/gpu=1 -> 0 pixeles; shared=1/gpu=0 -> 28k. Con 36 664
      // gaussianas la ordenacion en CPU no es cuello de botella, asi que se deja
      // desactivado siempre.
      gpuAcceleratedSort: false,
    });
    this.viewer = viewer;

    await viewer.addSplatScene(this.opciones.ply, {
      format: SceneFormat.Ply,
      splatAlphaRemovalThreshold: UMBRAL_ALFA,
      showLoadingUI: false,
      progressiveLoad: false,
      onProgress: (porcentaje, mensaje) =>
        this.opciones.onProgress?.(porcentaje, mensaje),
    });

    viewer.start();
  }

  async destruir(): Promise<void> {
    if (!this.viewer) return;
    this.viewer.stop();
    await this.viewer.dispose();
    this.viewer = null;
  }
}

import { SceneFormat, Viewer } from '@mkkellogg/gaussian-splats-3d';
import type { Vec3 } from '@mkkellogg/gaussian-splats-3d';

import type { CasoConfig } from './config';

/**
 * Aleja la camara en ventanas verticales.
 *
 * Con FOV vertical fijo, el campo horizontal se estrecha segun el aspecto: en un
 * movil en vertical (aspecto ~0,46) la arcada se salia por los lados. Encuadrar
 * en ancho exige multiplicar la distancia por 1/aspecto.
 */
function posicionCamara(caso: CasoConfig): Vec3 {
  const aspecto = window.innerWidth / window.innerHeight;
  const distancia = caso.distanciaBase * Math.max(1, 1 / aspecto);
  return [
    caso.centro[0] + caso.direccionCamara[0] * distancia,
    caso.centro[1] + caso.direccionCamara[1] * distancia,
    caso.centro[2] + caso.direccionCamara[2] * distancia,
  ];
}


export interface SplatViewerOptions {
  /** Contenedor donde se monta el canvas. */
  raiz: HTMLElement;
  /** Caso a mostrar (trae ply, grado de SH y encuadre). */
  caso: CasoConfig;
  onProgress?: (porcentaje: number, mensaje: string) => void;
}

/**
 * Envuelve el visor de gaussian-splats-3d con el encuadre del caso.
 *
 * Carga el PLY *completo* (posicion, escala, rotacion, opacidad y color). El
 * grado de armonicos lo fija el caso: Teeth3DS+ trae 9 coeficientes por canal
 * (grado 2); Bite2Text solo el DC (grado 0), color plano.
 */
export class SplatViewer {
  private viewer: Viewer | null = null;
  private readonly opciones: SplatViewerOptions;

  constructor(opciones: SplatViewerOptions) {
    this.opciones = opciones;
  }

  async cargar(): Promise<void> {
    const { caso } = this.opciones;

    // El worker de ordenacion usa SharedArrayBuffer, que solo existe si la
    // pagina esta cross-origin isolated (cabeceras COOP/COEP). Vite las pone en
    // local, pero un host estatico como GitHub Pages no puede. Se detecta en
    // ejecucion y se cae al camino sin memoria compartida, que funciona en
    // cualquier sitio: sin esto la escena no llega a cargar.
    const aislado = globalThis.crossOriginIsolated === true;

    const viewer = new Viewer({
      rootElement: this.opciones.raiz,
      cameraUp: caso.arriba,
      initialCameraPosition: posicionCamara(caso),
      initialCameraLookAt: caso.centro,
      sphericalHarmonicsDegree: caso.shGrado,
      useBuiltInControls: true,
      antialiased: true,
      sharedMemoryForWorkers: aislado,
      // gpuAcceleratedSort ROMPE el render: con el aislamiento activo (el caso
      // de `npm run dev`) la escena carga sin errores pero no se dibuja nada.
      // Medido: shared=1/gpu=1 -> 0 pixeles; shared=1/gpu=0 -> 28k. La
      // ordenacion en CPU no es cuello de botella aqui, asi que se deja off.
      gpuAcceleratedSort: false,
    });
    this.viewer = viewer;

    await viewer.addSplatScene(caso.ply, {
      format: SceneFormat.Ply,
      splatAlphaRemovalThreshold: caso.umbralAlfa,
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

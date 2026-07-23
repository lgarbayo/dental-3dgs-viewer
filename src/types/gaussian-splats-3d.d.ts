/**
 * Declaraciones para @mkkellogg/gaussian-splats-3d 0.4.7.
 *
 * El paquete no publica tipos (`"types"` ausente en su package.json), asi que
 * se declara aqui la superficie que usamos. Contrastado con su README y con los
 * `export {...}` del bundle ESM, no inventado.
 */
declare module '@mkkellogg/gaussian-splats-3d' {
  import type { Camera, Scene, WebGLRenderer } from 'three';

  export type Vec3 = [number, number, number];
  export type Quat = [number, number, number, number];

  export enum SceneFormat {
    Ply = 0,
    Splat = 1,
    KSplat = 2,
  }

  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }

  export interface ViewerOptions {
    /** Eje 'arriba' de la escena: el eje sobre el que orbita la camara. */
    cameraUp?: Vec3;
    initialCameraPosition?: Vec3;
    initialCameraLookAt?: Vec3;
    /** Grado de armonicos esfericos a cargar. Nuestro campo es de grado 0. */
    sphericalHarmonicsDegree?: 0 | 1 | 2;
    rootElement?: HTMLElement;
    selfDrivenMode?: boolean;
    useBuiltInControls?: boolean;
    /**
     * Usa SharedArrayBuffer para hablar con el worker de ordenacion. Exige que
     * la pagina este cross-origin isolated (cabeceras COOP/COEP). Por defecto true.
     */
    sharedMemoryForWorkers?: boolean;
    /** Recomendado solo si `sharedMemoryForWorkers` es true. */
    gpuAcceleratedSort?: boolean;
    sceneRevealMode?: SceneRevealMode;
    antialiased?: boolean;
    camera?: Camera;
    renderer?: WebGLRenderer;
    threeScene?: Scene;
  }

  export interface SplatSceneOptions {
    format?: SceneFormat;
    /** Descarta splats con alfa por debajo del umbral (0-255). */
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    position?: Vec3;
    rotation?: Quat;
    scale?: Vec3;
    progressiveLoad?: boolean;
    onProgress?: (percent: number, message: string, stage: unknown) => void;
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
    start(): void;
    stop(): void;
    dispose(): Promise<void>;
    getSplatCount?(): number;
    camera: Camera;
  }

  export class DropInViewer {
    constructor(options?: ViewerOptions);
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
  }
}

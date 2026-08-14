import type { Vec3 } from '@mkkellogg/gaussian-splats-3d';

/**
 * Metadatos y encuadre de un caso. Cada caso trae SU propio grado de armonicos y
 * su encuadre de camara, porque conviven campos en espacios distintos:
 *  - Teeth3DS+ conserva coordenadas en mm (no centrado) y color con armonicos.
 *  - Bite2Text esta normalizado a caja unidad y su color es RGB plano (grado 0).
 */
/**
 * Una capa de densidad: un campo gaussiano propio, con su ventana de HU.
 *
 * Las capas de un caso son DISJUNTAS y cubren toda la anatomia, asi que
 * encenderlas suma atenuacion (Beer-Lambert) sin contar nada dos veces. Ver
 * "solo hueso" o "esmalte + hueso" es cargar unos ficheros y no otros.
 */
export interface CapaConfig {
  readonly id: string;
  readonly nombre: string;
  readonly ply: string;
  readonly primitivas: number;
  /** Ventana de Hounsfield de la capa; null = sin cota por ese lado. */
  readonly hu: readonly [number | null, number | null];
  /**
   * Ganancia de visualizacion: alfa = 1 - exp(-g*sigma). NO es dato — la sigma
   * del artefacto es densidad sin cota, y un visor espera alfa en [0,1].
   */
  readonly gananciaDisplay: number;
  /** Falso color para distinguir capas a ojo. El artefacto no tiene color. */
  readonly color: string;
  readonly encendida: boolean;
}

export interface CasoConfig {
  readonly id: string;
  /** Etiqueta para el desplegable. */
  readonly nombre: string;
  /** 'ambas' para campos que traen maxilar y mandibula (p. ej. derivados de CBCT). */
  readonly arcada: 'upper' | 'lower' | 'ambas';
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
  /** Si existe, el caso se carga como N campos conmutables en vez de uno solo. */
  readonly capas?: readonly CapaConfig[];
  /**
   * JSON de cotas a dibujar sobre la anatomia. La medida va EN MILIMETROS sobre
   * el modelo, como en una radiografia anotada — no como color del campo.
   */
  readonly cotas?: string;
  /**
   * Si el .ply del caso se puede PUBLICAR. Por omision, 'publicos'.
   *
   * Un caso 'restringidos' se sigue declarando aqui —la receta, las cifras y los
   * creditos son trabajo propio y documentarlos no redistribuye nada— pero NO
   * aparece en el build de produccion. En `npm run dev` se ve igual que los demas,
   * que es donde se trabaja con los datos en local.
   *
   * No es cosmetica: este repo es PUBLICO y `public/*.ply` esta en .gitignore, asi
   * que un caso restringido listado en el build seria una entrada rota para
   * cualquiera que clone. Y sobre todo, cada .ply es un derivado de un dataset con
   * licencia — publicarlo es una decision de licencia, no de codigo.
   */
  readonly datos?: 'publicos' | 'restringidos';
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
    primitivas: 130_485,
    psnrRetenidas: 31.50,
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
    // Campo de baja opacidad (mediana ~0,01): el 83% de las gaussianas son
    // "neblina" que difumina los bordes (pelillos). Medido renderizando: cortar
    // a ~8/255 quita esa neblina y deja la arcada SOLIDA y limpia (el 17% opaco
    // ya sostiene toda la superficie), igual que el umbral 5 del otro caso.
    umbralAlfa: 8,
    nota:
      'Escáner STL + color de las 5 fotos intraorales (image-agent, sin EXIF): ' +
      'esmalte y encía muestreados y aplicados por región (coronas/margen). ' +
      '1600 vistas Blender (EEVEE) a 1024 px → gsplat, pérdida 0,8·L1 + 0,2·(1−SSIM). ' +
      'Color RGB plano (grado 0): no cambia al girar. El color per-píxel exige ' +
      'fusión foto↔malla (fase posterior).',
    creditos: 'Datos: Bite2Text (UNIMORE / Univ. Ferrara), CC-BY-SA 4.0 — derivado bajo la misma licencia.',
  },
  {
    id: 'ToothFairy2F_001',
    nombre: 'ToothFairy · F_001 (CBCT → STL → Blender)',
    arcada: 'ambas',
    // ToothFairy exige registro y aceptar un acuerdo en ditto.ing.unimore.it, ademas
    // de ser CC BY-NC-SA: el .ply no puede publicarse aqui y nunca ha estado en la
    // historia del repo. Las cifras si se quedan — describir una medida no es
    // redistribuir el dato.
    datos: 'restringidos',
    ply: 'toothfairy_f001_cbct.ply',
    primitivas: 161_997,
    psnrRetenidas: 38.22,
    vistasEntrenamiento: 220,
    vistasRetenidas: 32,
    iteraciones: 15_000,
    shGrado: 2,
    // Campo en mm, centrado en el centroide de los voxeles que ingirio el
    // cbct-agent; el eje vertical es z (la orbita de render gira sobre z).
    centro: [0.3, -1.4, 3.9],
    arriba: [0, 0, 1],
    direccionCamara: [0.77, 0.54, 0.34],
    distanciaBase: 150,
    umbralAlfa: 64,
    nota:
      'Unico caso que NO parte de un escaner: parte de un CBCT (0,3 mm isotropo). ' +
      'cbct-agent (serie DICOM) → isosuperficie a 500 HU (marching cubes) → 252 vistas ' +
      'Blender/Cycles a 800 px con poses exactas (error de reproyeccion 8·10⁻⁵ px) → gsplat. ' +
      'Es un modelo de SUPERFICIE: por dentro esta hueco, porque ninguna vista ve el ' +
      'interior del hueso que el CBCT si midio.',
    creditos:
      'Datos: cohorte ToothFairy (DITTO, UNIMORE), CC BY-NC-SA 4.0 — no comercial, ' +
      'derivados bajo la misma licencia.',
  },
  {
    id: 'ToothFairy2F_001_capas',
    nombre: 'ToothFairy · F_001 (capas por tejido, volumétrico)',
    arcada: 'ambas',
    datos: 'restringidos',  // mismo motivo que el caso anterior
    ply: 'ToothFairy2F_001_diente-esmalte.ply',
    primitivas: 176_865,
    psnrRetenidas: 47.62,
    vistasEntrenamiento: 220,
    vistasRetenidas: 32,
    iteraciones: 7_000,
    shGrado: 0,
    centro: [0.3, -1.4, 3.9],
    arriba: [0, 0, 1],
    direccionCamara: [0.77, 0.54, 0.34],
    distanciaBase: 150,
    // Las capas ya vienen con la ganancia de display aplicada (alfa mediana 0,35),
    // asi que no hace falta el umbral alto del caso fotometrico.
    umbralAlfa: 5,
    nota:
      'Rama VOLUMETRICA: el campo es densidad sigma >= 0 ajustada contra radiografias ' +
      'sinteticas (Beer-Lambert), sin armonicos esfericos y SIN COLOR. Cinco capas ' +
      'disjuntas (clase anatomica ∩ rango de HU, asi cada nombre significa un tejido) ' +
      'que cubren toda la anatomia: encenderlas suma ' +
      'atenuacion, y las cinco juntas reconstruyen la radiografia completa a 47,62 dB ' +
      '(el campo unico da 43,23 dB sobre las mismas vistas retenidas). ' +
      'Cada capa exporta solo sus gaussianas VIVAS: las que caen bajo el suelo del ' +
      'rasterizador (1/255) no contribuyen a la atenuacion medida y al ampliarlas para ' +
      'verlas tapaban la estructura. ' +
      'AVISO: el color de cada capa es FALSO COLOR de visualizacion y la opacidad es ' +
      'sigma reescalada; el artefacto conserva color_superficie = None (ADR 004 2.8).',
    creditos:
      'Datos: cohorte ToothFairy (DITTO, UNIMORE), CC BY-NC-SA 4.0 — no comercial, ' +
      'derivados bajo la misma licencia.',
    capas: [
      { id: 'diente-esmalte', nombre: 'Diente · esmalte', ply: 'ToothFairy2F_001_diente-esmalte.ply',
        primitivas: 30_718, hu: [2000, null], gananciaDisplay: 42.4,
        color: '#f2f7ff', encendida: true },
      { id: 'diente-dentina', nombre: 'Diente · dentina', ply: 'ToothFairy2F_001_diente-dentina.ply',
        primitivas: 37_424, hu: [null, 2000], gananciaDisplay: 34.1,
        color: '#d9e3f7', encendida: true },
      { id: 'hueso-cortical', nombre: 'Hueso · cortical', ply: 'ToothFairy2F_001_hueso-cortical.ply',
        primitivas: 24_537, hu: [1000, null], gananciaDisplay: 27.1,
        color: '#eddcb8', encendida: true },
      { id: 'hueso-trabecular', nombre: 'Hueso · trabecular', ply: 'ToothFairy2F_001_hueso-trabecular.ply',
        primitivas: 63_860, hu: [300, 1000], gananciaDisplay: 15.3,
        color: '#d99e8c', encendida: false },
      { id: 'hueso-medular', nombre: 'Hueso · medular', ply: 'ToothFairy2F_001_hueso-medular.ply',
        primitivas: 20_326, hu: [null, 300], gananciaDisplay: 17.9,
        color: '#9e8c85', encendida: false },
    ],
  },
  {
    id: 'histora_recesion',
    nombre: 'histora · desplazamiento del margen gingival (inferior)',
    arcada: 'lower',
    // Restringido POR AHORA, y por un motivo distinto al de ToothFairy: aqui los
    // facultativos dieron permiso, pero el .ply sigue sin commitear y una arcada
    // mandibular en 3D es material identificativo en odontologia forense. Que el
    // permiso cubra el uso no implica que cubra publicarla en un repo publico, y
    // la historia de git no se deshace. Para abrirlo: confirmarlo con ellos,
    // `git add -f public/histora_recesion_lower.ply`, y cambiar esta linea.
    datos: 'restringidos',
    ply: 'histora_recesion_lower.ply',
    // Las cotas NO se dibujan todavia. `src/Cotas.ts` y el JSON estan hechos y
    // probados; falta decidir que se ensena, porque una cifra por seccion no es
    // fiable de una en una — solo lo es su agregado. Reactivar es descomentar:
    // cotas: 'histora_recesion_lower_cotas.json',
    primitivas: 80_618,
    // Este caso NO viene de un entrenamiento: no hay vistas, ni iteraciones, ni PSNR
    // que informar, y poner cifras aqui seria inventarlas. Cero significa "no
    // aplica", y la nota lo dice. Ver el aviso de abajo.
    psnrRetenidas: 0,
    vistasEntrenamiento: 0,
    vistasRetenidas: 0,
    iteraciones: 0,
    shGrado: 0,
    // Marco del arco (PCA de la propia malla): x = largo, y = ancho, z = eje oclusal.
    // Centrado en el origen por construccion; extension 69,1 x 51,0 x 19,1 mm.
    centro: [0, 0, 0],
    arriba: [0, 0, 1],
    direccionCamara: [0, -0.92, 0.39],
    distanciaBase: 150,
    umbralAlfa: 5,
    nota:
      'MEDIDA sobre la anatomia, no reconstruccion. El campo es el escaneo POSTERIOR ' +
      'en marfil plano; las 21 cotas dicen EN MILIMETROS cuanto se movio el margen ' +
      'gingival respecto al escaneo previo (signo negativo = bajo). ' +
      'El registro entre los dos momentos se hace SOLO sobre las coronas, que no se ' +
      'mueven: 0,275 mm de residuo con 95% de solape. Desplazamiento mediano -0,62 mm, ' +
      'o sea 1,7 veces el ruido del registro. 19 de 21 secciones: dos se descartan '  +
      'porque el margen aparecio en caras opuestas y la resta no significaria nada. ' +
      'AVISO: no es un campo entrenado — no hay fotometria detras, solo geometria ' +
      'medida. Y NO es recesion absoluta: eso se define contra la union ' +
      'amelocementaria, que esta medido que no sale ni del CBCT ni de esta malla.',
    creditos:
      'Datos clinicos (histora). El desplazamiento lo calcula ' +
      'scripts/recesion_longitudinal.py del monorepo.',
  },
];

/**
 * Los casos que el visor OFRECE, que no son todos los declarados.
 *
 * En desarrollo se ven todos: es donde se trabaja, con los .ply en `public/` y sin
 * publicar nada. En el build de produccion caen los `restringidos`, cuyo .ply no
 * puede subirse a un repo publico y por tanto no estaria ahi para cargarse.
 *
 * El filtro es sobre el ARRAY, no sobre la carga: un caso restringido no se lista,
 * no se puede seleccionar y no se pide por red. Que `CASOS` los siga conteniendo es
 * deliberado — la receta y las cifras son trabajo propio y quedan documentadas.
 */
export const CASOS_VISIBLES: readonly CasoConfig[] = CASOS.filter(
  (c) => import.meta.env.DEV || c.datos !== 'restringidos',
);

# dental-3dgs-viewer

Visor web del campo de gaussianas entrenado en
[`dental-3dgs-lab`](https://github.com/lgarbayo/dental-3dgs-lab): abre en el
navegador el `.ply` de 3D Gaussian Splatting de un escaneo intraoral y permite
rotarlo, hacer zoom y desplazarlo.

**three.js + TypeScript**, con
[`@mkkellogg/gaussian-splats-3d`](https://github.com/mkkellogg/GaussianSplats3D)
como rasterizador de splats.

## Arrancar

```bash
npm install
npm run dev      # http://localhost:5173
```

Otros comandos: `npm run build` (a `dist/`), `npm run preview`, `npm run typecheck`.

## Qué se está viendo

El caso `01A6GW4A_lower` de Teeth3DS+, entrenado con `gsplat` durante 9 000
iteraciones sobre 462 vistas sintéticas, y evaluado en 66 vistas retenidas
(**32,49 dB** de PSNR).

Es el **campo de gaussianas de verdad**, no una nube de puntos: el `.ply` está en
el formato estándar de 3DGS e incluye, por primitiva, posición, escala,
rotación (cuaternión), opacidad y color como **9 coeficientes de armónicos
esféricos por canal** (el DC más 8 de orden superior).

La receta del notebook de origen es la del 3DGS de referencia: pérdida
`0,8·L1 + 0,2·(1−SSIM)`, densificación y poda (`DefaultStrategy`) y armónicos
esféricos de grado 2 — por eso el brillo cambia al girar el modelo. Frente a
«L1 sola, sin densificar, sin armónicos» eso sube el PSNR de 22,6 a 32,5 dB, y
la fracción de gaussianas útiles (opacas y de tamaño razonable) del 6 % al 35 %.

## Dos detalles de implementación que no son obvios

**Aislamiento de origen cruzado.** El visor ordena los splats en un web worker y
por defecto usa `SharedArrayBuffer`, que exige que la página esté
`crossOriginIsolated` (cabeceras `COOP`/`COEP`). Un host estático como GitHub
Pages **no puede enviarlas**. `SplatViewer` lo detecta en ejecución y cae al
camino sin memoria compartida, así que funciona en cualquier sitio; Vite sí pone
las cabeceras en local (`vite.config.ts`) para usar el camino rápido.

**Encuadre.** La escena viene en milímetros y conserva las coordenadas de la
malla original (no está centrada en el origen). El centro de cámara se calcula
sobre las gaussianas «de masa» —opacas y de menos de 5 mm—, porque el centroide
de *todas* queda desplazado por las que quedan dispersas tras densificar.

**Armónicos esféricos.** El ply trae 9 coeficientes por canal, así que el visor
debe cargarlo con `sphericalHarmonicsDegree: 2`. Con grado 0 se vería, pero
plano: se perdería la dependencia del color con el ángulo de vista.

## Estructura

```
index.html
vite.config.ts             cabeceras COOP/COEP + separación de chunks
public/trained_3dgs.ply    campo entrenado, formato 3DGS estándar (24 MB)
src/
  main.ts                  arranque
  SplatViewer.ts           ciclo de vida del visor
  InfoPanel.ts             ficha del caso sobre el lienzo
  config.ts                datos del caso y encuadre de cámara
  estilos.css
  types/gaussian-splats-3d.d.ts   la librería no publica tipos
```

## Datos

[Teeth3DS+](https://github.com/abenhamadou/3DTeethSeg_MICCAI_Challenges)
(Ben-Hamadou et al., MICCAI 3DTeethSeg'22), **CC-BY 4.0** — atribución obligatoria
en cualquier derivado, incluido el `.ply` que se sirve aquí.

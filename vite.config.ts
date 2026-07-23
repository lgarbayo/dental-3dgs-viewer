import { defineConfig } from 'vite';

/**
 * Cabeceras de aislamiento de origen cruzado.
 *
 * Con ellas la pagina queda `crossOriginIsolated` y el visor puede usar
 * SharedArrayBuffer para el worker que ordena los splats (camino rapido).
 * Sin ellas cae al camino sin memoria compartida — ver SplatViewer.ts.
 *
 * Un host estatico como GitHub Pages NO puede enviarlas, asi que el codigo no
 * debe depender de que esten.
 */
const cabecerasAislamiento = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  base: './',
  server: { headers: cabecerasAislamiento },
  preview: { headers: cabecerasAislamiento },
  build: {
    target: 'es2022',
    // three.js + el visor de splats pesan; se separan para que el navegador
    // los cachee aparte del codigo propio.
    rollupOptions: {
      output: {
        manualChunks: {
          splats: ['@mkkellogg/gaussian-splats-3d'],
          three: ['three'],
        },
      },
    },
  },
});

# Atribución y licencias de los datos

Cada `.ply` de `public/` **no es código**: es una obra derivada de un dataset
dental con licencia propia, entrenada a partir de sus mallas o sus imágenes. La
licencia MIT del repositorio cubre el visor, **no** estos ficheros. Esta página
dice, fichero a fichero, de dónde sale cada uno y bajo qué condiciones se
redistribuye.

## Ficheros publicados en este repositorio

### `public/trained_3dgs.ply` — Teeth3DS+

- **Fuente**: [Teeth3DS+](https://github.com/abenhamadou/3DTeethSeg_MICCAI_Challenges),
  Ben-Hamadou et al., *MICCAI 3DTeethSeg'22 challenge*.
- **Licencia del dataset**: **CC BY 4.0**.
- **Qué es este fichero**: campo de gaussianas entrenado sobre vistas sintéticas
  del caso `01A6GW4A_lower`. Obra derivada.
- **Condiciones**: atribución obligatoria, que es lo que hace esta entrada. No
  hay cláusula de compartir-igual ni restricción comercial.

### `public/bite2text_f1980_lower.ply` — Bite2Text

- **Fuente**: **Bite2Text** (UNIMORE / Universidad de Ferrara), caso `F1980`.
- **Licencia del dataset**: **CC BY-SA 4.0**.
- **Qué es este fichero**: campo de gaussianas entrenado a partir del escaneo STL
  del caso, con el color muestreado de sus fotos intraorales. Obra derivada
  («adapted material» en los términos de la licencia).
- **Condiciones**: atribución **y compartir-igual**. En consecuencia, este `.ply`
  **se redistribuye bajo CC BY-SA 4.0**, no bajo la MIT del código. Quien lo
  reutilice o lo modifique tiene que mantener esa misma licencia y citar a
  Bite2Text.

  > Texto de la licencia: <https://creativecommons.org/licenses/by-sa/4.0/>

## Datos que **no** se publican aquí, y por qué

### Cohorte ToothFairy (DITTO, UNIMORE)

- **Licencia**: **CC BY-NC-SA 4.0** — no comercial y compartir-igual.
- **Acceso restringido**: la descarga exige registro y aceptar un acuerdo de uso
  en <https://ditto.ing.unimore.it/toothfairy4/>.
- **Consecuencia**: los campos derivados de ToothFairy (reconstrucciones
  volumétricas de CBCT, capas de densidad por tejido) **no se pueden publicar en
  este repositorio**, que es público. Existen en local para experimentar, y
  `.gitignore` bloquea `public/*.ply` precisamente para que no acaben subidos por
  un `git add .` distraído.

## Regla de la casa

`public/*.ply` está en `.gitignore`. Añadir un campo nuevo exige `git add -f`, y
eso es a propósito: **publicar un `.ply` es una decisión de licencia, no de
código**. Antes de forzarlo, comprueba tres cosas y anótalas aquí:

1. ¿Qué dataset lo originó y bajo qué licencia?
2. ¿Permite redistribuir obras derivadas? ¿Exige compartir-igual?
3. ¿El acceso al dataset original estaba detrás de un registro o un acuerdo de
   uso? Si lo estaba, la respuesta por defecto es **no publicarlo**.

## Software de terceros

El rasterizador es
[`@mkkellogg/gaussian-splats-3d`](https://github.com/mkkellogg/GaussianSplats3D)
(MIT), sobre `three.js` (MIT). Se instalan como dependencias; no se redistribuye
su código en este repositorio.

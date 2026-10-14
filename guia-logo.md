# Guía para el logo — Mega Fragancia

## Estado actual

El sitio tiene un **logo placeholder** en `assets/svg/logo.svg`:
- Un frasco estilizado con la inicial **M**
- El texto "MEGA FRAGANCIA"
- El slogan: **"PERFUMES ÁRABES Y DE NICHO · 100% ORIGINALES"**

## Cómo reemplazarlo con el logo real del negocio

### Opción A — Tienes el logo en SVG (preferida)

1. Pide al cliente o al diseñador el archivo `logo.svg` o `logo.png` con fondo transparente.
2. Reemplaza el archivo en `assets/svg/logo.svg` (mismo nombre, mismo path).
3. Si el logo es horizontal (logo + texto al lado), listo.
4. Si el logo es solo el ícono o solo el texto, hay que ajustar:
   - Abre `index.html` y busca `<img src="assets/svg/logo.svg" ...>`.
   - Ajusta el `width` y `height` para que se vea bien en el header (recomendado: 36-44px de alto).
   - Si el logo es solo texto, elimina el `<img>` y deja solo el texto dentro del `<a class="brand">`.

### Opción B — Tienes el logo en PNG

1. Convierte el PNG a SVG en [convertio.co](https://convertio.co/es/png-svg/) o con Inkscape.
2. Renombra el archivo a `logo.svg` y guárdalo en `assets/svg/`.
3. Reemplaza el actual.

### Opción C — No tienes logo todavía

1. Pide al cliente una imagen del logo en alta resolución (mínimo 500x500 px).
2. Si el cliente solo tiene el logo impreso o en baja calidad, recréalo en [Canva](https://www.canva.com) (tiene plantillas de logos de perfumería gratis) o en [Looka](https://looka.com).
3. Exporta como PNG con fondo transparente, luego conviértelo a SVG.

## Especificaciones recomendadas

| Atributo | Valor recomendado |
|----------|------------------|
| **Formato** | SVG (vectorial, escala sin perder calidad) |
| **Relación de aspecto** | Horizontal (ej. 3:1) — funciona mejor en el header |
| **Colores** | El logo debería usar 2-3 colores máximo. La paleta actual del sitio es: marrón oscuro `#1f1a14`, dorado `#b8895a`, dorado oscuro `#8e6438`, terracota `#c66a4a`. |
| **Tipografía** | Si tiene texto, serif (como Playfair Display, Cormorant Garamond o Georgia) para mantener la coherencia con el sitio. |
| **Tamaño en el header** | 32-44px de alto |

## Dónde aparece el logo actualmente

| Archivo | Línea | Uso |
|---------|-------|-----|
| `assets/svg/logo.svg` | — | Logo vectorial principal |
| `assets/svg/favicon.svg` | — | Ícono pequeño para pestaña del navegador |
| `index.html` | 24 | `<img src="assets/svg/logo.svg" ...>` en el header |

## Slogan / tagline usado

El slogan del logo placeholder es: **"PERFUMES ÁRABES Y DE NICHO · 100% ORIGINALES"**

Si el cliente quiere otro slogan, edita la línea correspondiente en `logo.svg` (busca `PERFUMES ÁRABES Y DE NICHO`).

En el hero del sitio aparece: **"Sin réplicas. Consulta disponibilidad y pide por WhatsApp o Instagram."** — esto refuerza el mensaje de autenticidad y la llamada a la acción.

## Cómo probar después de cambiar el logo

1. Abre el sitio localmente (o espera al deploy).
2. Verifica que el logo se ve bien en:
   - Header (esquina superior izquierda, ~32px de alto)
   - Pestaña del navegador (favicon)
3. Si el logo se ve pixelado, es porque es un PNG. Conviértelo a SVG.
4. Si el logo se ve muy chico o muy grande, ajusta el `width` en el HTML.

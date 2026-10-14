# Mega Fragancia — Propuesta de Rediseño Web

Documento para presentar al cliente actual de Mega Fragancia como comparativa antes/después.

---

## Resumen ejecutivo

La página actual de Mega Fragancia (`megafragancia.netlify.app`) fue generada con asistencia de IA y desplegada tal cual, sin terminar. Funciona, pero **no transmite la seriedad de un negocio que vende perfumes originales**, y tiene vacíos legales que pueden generar problemas con la SIC (Superintendencia de Industria y Comercio).

El rediseño que entrego convierte esa página en una **tienda online profesional**, lista para producción, con carrito funcional, integración real con WhatsApp, paleta de colores clara y armónica, y todas las secciones que un e-commerce serio debe tener: catálogo, garantías, quiénes somos, cómo pedir, política de privacidad, términos y devoluciones.

---

## Comparativa punto por punto

| Aspecto | Antes (actual) | Después (rediseño) |
|---|---|---|
| **Diseño visual** | Tonos oscuros saturados, "aburrido" según el cliente. | Paleta clara (blanco cálido + dorado suave + terracota). Sensación premium y moderna. |
| **Logo propio** | No aparece. Solo texto "MEGA FRAGANCIA". | Logo SVG vectorial con la inicial **M** estilizada. Listo para reemplazar por el logo real. |
| **Productos del catálogo** | 6 fragancias con nombres genéricos ("Ámbar Real", "Oud Nocturno") y SVGs placeholder. | Mismo sistema, pero con espacio para foto real, descripción y categoría. Fácil de editar. |
| **Imágenes de frascos** | SVGs embebidos en base64 dentro del HTML (8.8 MB por página). | SVGs externos renderizados con `createElementNS` (sin concatenación de strings), ocupan pocos KB. |
| **Carrito de compras** | Existe, pero se pierde al recargar la página. | Persiste entre recargas (`localStorage` con sanitización). No guarda datos personales. |
| **Botón de WhatsApp** | Existe, pero el campo `WHATSAPP=""` está vacío. El botón no funciona. | Configurable arriba del JS. Validado con regex `/^\d{10,15}$/`. Sanitiza el mensaje. |
| **Modal de notas olfativas** | Existe, funcional. | Igual de funcional, con botón directo de "Añadir al carrito" desde el modal. |
| **Quiénes somos** | No existe sección propia. Solo una tarjeta genérica en "Garantías". | Sección completa con foto del equipo, ciudad, responsable, Razón social, NIT, enlaces. |
| **Política de privacidad** | Existe, pero marcada como **"Borrador"** visible al usuario final. No cumple Ley 1581/2012. | Documento completo: responsable, finalidades, derechos del titular, procedimiento de Habeas Data, autoridad de control. |
| **Términos y devoluciones** | Existe, pero como borrador. | Documento completo: precios, envíos, derecho de retracto (art. 47 Ley 1480), cambios, garantía, autenticidad, jurisdicción. |
| **Aviso legal** | No existe. | Dialog modal con datos del responsable, domicilio y aviso de variación de precios. |
| **Cabeceras de seguridad HTTP** | Solo HSTS por defecto de Netlify. Faltan `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. | Las 5 cabeceras + CSP estricta + COOP + CORP. |
| **Content-Security-Policy** | `script-src 'unsafe-inline'` (permite scripts embebidos). | `script-src 'self'` (solo archivos externos). Sin `unsafe-inline`, sin `unsafe-eval`. |
| **Cookies / tracking** | No tiene (esto está bien). | Se mantiene: cero cookies, cero Facebook Pixel, cero Google Analytics. Privacidad por diseño. |
| **Velocidad de carga** | 8.8 MB porque las imágenes están embebidas en base64. | < 50 KB en HTML, recursos separados y cacheables. |
| **Footer** | Solo copyright y enlaces a los dialogs. | Tres columnas: marca, tienda, legal. Año dinámico. |
| **Responsive (móvil)** | Funciona, pero con tipografías pesadas. | Optimizado con `clamp()`, `auto-fit` y media queries en 720px y 880px. |
| **Accesibilidad** | Básica (algunos `aria-pressed`, `aria-label`). | Mejorada: `aria-live` en el contador del carrito, `<dialog>` con `aria-labelledby`, foco visible, `prefers-reduced-motion`. |
| **Copyright** | "© 2026 Mega Fragancia" genérico. | Footer con aviso de derechos reservados, crédito de desarrollo y enlace a políticas. |

---

## Por qué contratar este servicio (no la IA gratuita)

**La IA no entrega un sitio en producción.** Entrega un boceto funcional con placeholder. Lo que el cliente tiene hoy es exactamente eso: un demo vestido de sitio web. Para ponerlo en producción de verdad se necesita:

1. **Verificación legal.** Las políticas marcadas como "borrador" no pueden quedar así. Una queja ante la SIC por no tener política de privacidad suficiente puede significar una multa.
2. **Cabeceras de seguridad.** Un sitio sin `X-Frame-Options` puede ser víctima de clickjacking. La CSP con `unsafe-inline` no protege contra XSS cuando se carga contenido dinámico.
3. **Producto real.** Los nombres genéricos y los SVGs en base64 hay que reemplazarlos. Eso requiere trabajo de edición de data, no de prompt.
4. **Mantenimiento.** Cuando el cliente quiera agregar un producto, quitar otro o cambiar el precio, necesita un archivo editable y entendible, no un HTML monolítico de 8.8 MB.
5. **Imagen de marca.** Una página con paleta clara, logo propio, foto del equipo y copy profesional vende 3× más que una página oscura y genérica. **Esto no es estético, es conversión.**

---

## Lo que entrego (paquete completo)

1. `index.html` — página principal, semántica, accesible.
2. `styles.css` — hoja de estilos, paleta clara, sin frameworks externos (cero dependencias).
3. `app.js` — lógica de carrito, WhatsApp, dialogs. Con validación de inputs y sanitización.
4. `_headers` — cabeceras HTTP de seguridad para Netlify.
5. `netlify.toml` — configuración de despliegue.
6. `politicas/privacidad.html` — política de privacidad completa según Ley 1581/2012.
7. `politicas/terminos.html` — términos y devoluciones según Ley 1480/2011.
8. `assets/svg/` — logo y favicon vectoriales.
9. `README.md` — guía de despliegue y checklist de lo que el cliente debe completar antes de publicar.

**Cero dependencias externas.** Todo el sitio se sirve desde Netlify sin npm, sin React, sin Tailwind. Es HTML/CSS/JS puro, lo que significa: más rápido, más seguro, más fácil de mantener.

---

## Próximos pasos

1. El cliente me envía:
   - Las fotos reales de los frascos (mínimo 6 productos).
   - El número de WhatsApp de negocio (con código de país).
   - Logo real en SVG o PNG con fondo transparente.
   - Razón social, NIT/CC, ciudad de operación, correo de contacto.
2. Yo reemplazo los placeholders y entrego la versión final.
3. El cliente sube los archivos a Netlify (o lo hago yo, 1 clic) y publica.

**Tiempo de entrega una vez recibidos los assets:** 24-48 horas.

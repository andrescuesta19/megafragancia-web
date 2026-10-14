# Mega Fragancia — Landing

Rediseño de la landing de Mega Fragancia (perfumes árabes y de nicho).

## Estructura

```
megafragancia/
├── index.html              # Página principal
├── app.js                  # Lógica: carrito, WhatsApp, dialogs
├── styles.css              # Estilos (paleta clara, sin colores saturados)
├── _headers                # Cabeceras de seguridad para Netlify
├── netlify.toml            # Config de build + headers
├── politicas/
│   ├── privacidad.html     # Política de privacidad (Ley 1581/2012)
│   └── terminos.html       # Términos y devoluciones (Estatuto del Consumidor)
└── assets/
    ├── svg/
    │   ├── logo.svg
    │   └── favicon.svg
    └── img/                # [Vacío: colocar aquí las fotos reales de los productos]
```

## Despliegue

1. Sube la carpeta a un nuevo repositorio de GitHub.
2. En Netlify: **Add new site → Import an existing project** → conecta el repo.
3. Build command: *(vacío)* · Publish directory: `.`
4. Deploy. Netlify detecta automáticamente `_headers` y `netlify.toml`.

## Antes de publicar

- [ ] Verificar que el número de WhatsApp en `app.js` línea 15 es el correcto: actualmente `'573106399810'`.
- [ ] Reemplazar el array `DATA` en `app.js` con los productos reales, incluyendo fotos en `assets/img/`.
- [ ] Completar los campos entre corchetes `[...]` en `index.html` (responsable, ciudad, Razón social, NIT).
- [ ] Reemplazar la foto placeholder de "Nosotros" en `index.html` por una foto real del equipo o local.
- [ ] Reemplazar el logo placeholder en `assets/svg/logo.svg` por el logo real del cliente (ver `guia-logo.md`).
- [ ] Validar las políticas de privacidad y términos con un abogado antes de quitar los marcadores `[A REVISAR POR ABOGADO]`.

## Panel de administración

El sitio incluye un panel admin (ícono de engranaje en el header) que permite al cliente:

- Activar/desactivar la promoción del mes
- Cambiar el título, subtítulo, vigencia y precio del combo
- Los cambios se guardan en el navegador del cliente (localStorage)

**Clave por defecto:** `mega2026`

**⚠️ Para cambiar la clave:**

1. Abre la consola del navegador en el sitio (F12 → Consola)
2. Escribe: `simpleHash("tu_nueva_clave")` y copia el resultado
3. En `app.js`, reemplaza el valor dentro de la función que calcula `EXPECTED_HASH` (busca la línea con `var s = 'mega2026';`)

**Importante:** Esta NO es seguridad real. Es una barrera para evitar que el cliente toque la promo por error. El código es público. Para una solución más robusta en el futuro, mover a autenticación server-side.

## Verificación post-deploy

```bash
# Comprobar headers
curl -I https://tusitio.netlify.app/

# Debe mostrar, entre otros:
#   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
#   X-Content-Type-Options: nosniff
#   X-Frame-Options: DENY
#   Content-Security-Policy: default-src 'none'; ...
```

Probar el flujo completo:
1. Agregar 2 fragancias al carrito.
2. Click en "Pedir por WhatsApp" → debe abrir WhatsApp con el pedido pre-escrito.
3. Verificar en DevTools → Application → Local Storage que `mf_cart` solo guarda nombres y cantidades.

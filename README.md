# Mega Fragancia — Landing

Landing estática para Mega Fragancia (perfumes árabes y de nicho, Turbo, Antioquia).
Sincronización automática entre dispositivos vía GitHub API.

## Estado del proyecto

- **Deploy:** Netlify (sirve archivos estáticos)
- **Datos editables:** `data.json` (se actualiza vía GitHub API desde el panel admin)
- **Carrito:** `localStorage` (por dispositivo — el carrito de cada visitante es local)
- **Privacidad del repo:** PRIVADO (obligatorio, contiene datos del cliente)

## Estructura

```
megafragancia/
├── index.html              # Página principal
├── app.js                  # Lógica: carrito, WhatsApp, dialogs, panel admin
├── styles.css              # Estilos (paleta negra + dorado, degradado fluido)
├── data.json               # Datos editables (promo, productos, textos)
├── _headers                # Cabeceras de seguridad para Netlify
├── netlify.toml            # Config de build
├── politicas/
│   ├── privacidad.html     # Política de privacidad
│   └── terminos.html       # Términos y devoluciones
└── assets/
    ├── svg/
    │   ├── logo.svg
    │   └── favicon.svg
    └── img/
        ├── logo-original.jpg        # Logo real del cliente
        ├── equipo/vendedor.jpg      # Foto del vendedor
        └── productos/               # [Vacío: las fotos se suben desde el admin]
```

## Antes de publicar (checklist)

- [ ] Configurar el GitHub Personal Access Token (ver `SETUP-GITHUB-TOKEN.md`)
- [ ] Verificar que el número de WhatsApp en `app.js` línea 17 es `573106399810`
- [ ] Personalizar los placeholders `[...]` en `index.html` y en las políticas
- [ ] Reemplazar el logo placeholder si se tiene uno mejor
- [ ] Validar las políticas con un abogado

## Panel de administración

El sitio incluye un panel admin (ícono de engranaje en el header) que permite:

- **Promo:** activar/desactivar, cambiar título, subtítulo, vigencia, precio
- **Productos:** agregar con foto desde el celular/computador, eliminar
- **Textos:** editar el título del hero, descripción, texto de "Nosotros"

**Clave por defecto:** `mega2026`

**Sincronización:** cada vez que el cliente guarda algo, se sube automáticamente a GitHub.
Después de unos segundos, todos los dispositivos ven el cambio.

## Desarrollo local

```bash
# Servir con cualquier servidor estático
python3 -m http.server 8000
# Abre http://localhost:8000
```

## Despliegue

El deploy es automático desde GitHub:
1. Push a la rama `main`
2. Netlify detecta el cambio y redespliega en 30-60 segundos
3. El sitio se actualiza en `https://[nombre].netlify.app`

## Verificación de seguridad

```bash
curl -I https://megafragancia.netlify.app/
```

Debe mostrar:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy: default-src 'none'; ...`

## Soporte

Para dudas o cambios, contactar al desarrollador: **Andrés Cuesta**.

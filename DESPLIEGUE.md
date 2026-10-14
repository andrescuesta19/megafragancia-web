# Despliegue paso a paso — Mega Fragancia

Esta guía te lleva desde cero hasta el sitio publicado en internet.

---

## Antes de empezar

Necesitas:
- Una cuenta de **GitHub** (gratis) → https://github.com/signup
- Una cuenta de **Netlify** (gratis) → https://app.netlify.com/signup
- 15 minutos

Ambas cuentas se pueden crear con el mismo email. Netlify te deja entrar con tu cuenta de GitHub directamente.

---

## Paso 1 · Crear el repositorio en GitHub

1. Ve a https://github.com/new
2. Llena el formulario:
   - **Repository name:** `megafragancia-web`
   - **Description:** "Landing de Mega Fragancia — perfumes árabes y de nicho"
   - Visibilidad: **Private** (recomendado al inicio, lo haces público cuando termines)
3. **NO marques** ninguna casilla de "Initialize this repository with..." (README, .gitignore, license). Déjalo vacío.
4. Click en **Create repository**

Te va a mostrar una pantalla con instrucciones. Ignóralas y sigue con el Paso 2.

---

## Paso 2 · Subir el código a GitHub

Tienes dos opciones. La más fácil es la opción A.

### Opción A — Desde la web de GitHub (sin Terminal)

1. En la página de tu repo nuevo, click en el link que dice **"uploading an existing file"**
2. Se abre un área de drag & drop. Arrastra toda la carpeta `megafragancia` (o los 14 archivos sueltos)
3. Espera a que termine de subir
4. Abajo, en "Commit changes", deja el mensaje por defecto o pon: `Initial commit: sitio completo`
5. Click en **Commit changes**

Listo. Tu código ya está en GitHub.

### Opción B — Desde Terminal (con git)

Si te sientes cómodo con la Terminal:

```bash
cd ~/Proyectos/megafragancia
git remote add origin https://github.com/TU_USUARIO/megafragancia-web.git
git branch -M main
git push -u origin main
```

Te va a pedir usuario y contraseña de GitHub. Si tienes autenticación de 2 factores activa, necesitas un **Personal Access Token** en lugar de la contraseña:
- Genera uno en https://github.com/settings/tokens/new
- Marca solo el scope `repo`
- Úsalo como contraseña cuando te lo pida

---

## Paso 3 · Conectar Netlify

1. Ve a https://app.netlify.com
2. Click en **Add new site** → **Import an existing project**
3. Click en **GitHub** como proveedor
4. Si es la primera vez, te pide autorizar a Netlify para acceder a tus repos. Autoriza.
5. Busca y selecciona **`megafragancia-web`**
6. Te muestra la pantalla de configuración de deploy:
   - **Branch to deploy:** `main` (déjalo así)
   - **Build command:** déjalo **vacío**
   - **Publish directory:** escribe **`.`** (un punto)
   - **Functions directory:** déjalo vacío
7. Click en **Deploy site**

Netlify empieza a compilar. En 20-30 segundos te dice "Site is live".

Te asigna una URL aleatoria tipo `https://random-name-12345.netlify.app`. Puedes verla y cambiarla.

---

## Paso 4 · Configurar la URL (opcional)

1. En el dashboard de Netlify, click en **Site settings** → **Change site name**
2. Escribe algo como `megafragancia` (si está disponible, te deja)
3. Tu sitio quedará en `https://megafragancia.netlify.app`

---

## Paso 5 · Activar HTTPS

Netlify lo hace automático, pero verifica:

1. Ve a **Site settings** → **Domain management** → **HTTPS**
2. Debe decir "Your site's HTTPS is enabled" con un certificado de Let's Encrypt
3. Activa **Force HTTPS** si no está activo

---

## Paso 6 · Probar que todo funcione

Abre tu sitio (`https://megafragancia.netlify.app`) y verifica:

- [ ] La página carga sin errores
- [ ] El logo aparece en el header
- [ ] El botón "Armar mi combo" lleva al catálogo
- [ ] Puedes filtrar por Hombre / Mujer / Unisex
- [ ] Agregar 2 fragancias al carrito activa el combo
- [ ] El botón "Pedir por WhatsApp" abre WhatsApp con el mensaje pre-armado en el número `+57 310 6399810`
- [ ] El ícono de engranaje (⚙) abre el panel admin con clave `mega2026`
- [ ] Las páginas `/politicas/privacidad.html` y `/politicas/terminos.html` cargan
- [ ] En el celular se ve bien (responsive)
- [ ] En la consola del navegador (F12) no hay errores rojos

Si todo funciona, **ya está publicado**.

---

## Próximos pasos (después del deploy)

### Configurar dominio propio (opcional)

Si el cliente quiere `megafragancia.com.co`:

1. Compra el dominio en Namecheap, GoDaddy, Google Domains, etc.
2. En Netlify: **Domain settings** → **Add custom domain** → escribe el dominio
3. Netlify te da los nameservers o registros DNS para configurar
4. Configúralos donde compraste el dominio
5. Espera 24-48 horas a que propague
6. Activa **Force HTTPS** y **HSTS preload**

### Actualizar contenido cuando el cliente lo pida

**Cambios menores** (textos, precios, agregar productos):
1. Edita los archivos en `~/Proyectos/megafragancia/`
2. Sube los cambios a GitHub (opción A: drag & drop en la web; opción B: `git add . && git commit -m "..." && git push`)
3. Netlify redespliega automáticamente en 30 segundos

**Cambio de promo mensual** (octubre → noviembre):
- El cliente mismo lo hace desde el panel admin del sitio. No requiere tocar código ni redesplegar.

---

## Solución de problemas

### El sitio no carga
- Verifica que el deploy terminó sin errores en Netlify (pestaña "Deploys")
- Revisa la consola del navegador (F12) por errores

### Los cambios en GitHub no se ven en el sitio
- Revisa la pestaña "Deploys" en Netlify. Si no hay un deploy nuevo, click en "Trigger deploy" → "Deploy site"

### El botón de WhatsApp no abre nada
- Verifica que en `app.js` la línea 16 diga `var WHATSAPP = '573106399810';`
- Redespliega (Netlify debería hacerlo solo al detectar el cambio)

### El panel admin no entra con `mega2026`
- Verifica que estés escribiendo exactamente `mega2026` (todo minúsculas, sin espacios)
- Si la cambiaste, sigue las instrucciones del README.md para regenerar el hash

### Las imágenes de productos no aparecen
- Recuerda: los SVGs actuales son placeholders. Sube fotos reales a `assets/img/` y edita el array `DATA` en `app.js`
- Después del cambio, redespliega

---

## Checklist final

Antes de mostrarle el sitio al cliente:

- [ ] Reemplazar el logo placeholder por el logo real (ver `guia-logo.md`)
- [ ] Subir las fotos reales de los frascos a `assets/img/`
- [ ] Actualizar el array `DATA` en `app.js` con los productos reales
- [ ] Completar los `[datos del responsable]` en `index.html`
- [ ] Completar los datos en `politicas/privacidad.html` y `terminos.html`
- [ ] Validar las políticas con un abogado
- [ ] Probar el flujo completo de compra
- [ ] Probar en móvil
- [ ] (Opcional) Configurar dominio propio

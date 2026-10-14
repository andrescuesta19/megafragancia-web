# Configuración de sincronización automática entre dispositivos

## Cómo funciona

1. El cliente (dueño de la tienda) abre el admin en su celular o computador
2. Sube fotos, edita promos, agrega productos
3. Click en "Guardar" → los datos se suben automáticamente a GitHub
4. **Todos los dispositivos ven los cambios al instante**

El cliente **NO tiene que pegar ningún token**. Todo es automático.

## Cómo funciona por debajo

```
Cliente hace click en "Guardar"
        ↓
Navegador envía los datos a la Netlify Function (en el servidor)
        ↓
Netlify Function (con tu token seguro guardado en Netlify)
        ↓
GitHub API actualiza data.json en el repo
        ↓
Netlify redespliega automáticamente
        ↓
Todos los dispositivos ven el cambio
```

**El token NUNCA se expone en el código del repositorio.** Vive seguro en las variables de entorno de Netlify.

## Setup (lo haces UNA sola vez, 5 minutos)

### Paso 1 — Crear el Personal Access Token en GitHub

1. Abre https://github.com/settings/tokens/new
2. Inicia sesión con tu cuenta
3. Llena:
   - **Note:** `Mega Fragancia Netlify Function`
   - **Expiration:** `No expiration` (o 1 año)
   - **Scopes:** ✅ Solo `repo`
4. Click **"Generate token"**
5. **Copia el token** (empieza con `github_pat_...` o `ghp_...`)

### Paso 2 — Configurar el token en Netlify

1. Abre https://app.netlify.com
2. Selecciona tu sitio `megafragancia-web`
3. Ve a **Site configuration** → **Environment variables**
4. Click en **"Add a variable"** → **"Add a single variable"**
5. Llena:
   - **Key:** `GITHUB_TOKEN`
   - **Value:** pega el token que copiaste
   - **Scope:** `All scopes` (o al menos `Production`)
6. Click **"Create variable"**

(Opcional, puedes agregar más variables para personalizar:)
- `ADMIN_PASSWORD` → la clave del admin (default: `mega2026`)
- `GITHUB_REPO` → el repo (default: `andrescuesta19/megafragancia-web`)
- `GITHUB_BRANCH` → la rama (default: `main`)

### Paso 3 — Re-desplegar

Después de agregar la variable, Netlify necesita re-desplegar para que la Function la use:

1. Ve a la pestaña **"Deploys"**
2. Click en **"Trigger deploy"** → **"Deploy site"**
3. Espera 30-60 segundos

### Paso 4 — Probar

1. Abre el sitio en tu celular
2. Click en ⚙ del header
3. Ingresa la clave `mega2026`
4. Cambia algo (ej: el texto de la promo)
5. Click "Guardar"
6. Espera 5-10 segundos
7. Debe decir "✓ Guardado y sincronizado"
8. Abre el sitio en el computador (con `Cmd + Shift + R`)
9. El cambio debe verse

## Si algo falla

### "Error: GITHUB_TOKEN no configurado en Netlify"
- La variable de entorno no se guardó bien
- Verifica en **Site configuration → Environment variables** que existe `GITHUB_TOKEN` con el valor correcto
- Re-despliega

### "Error 401" o "Bad credentials"
- El token es incorrecto o expiró
- Genera uno nuevo y reemplázalo en Netlify

### "Error 404" o "Not Found"
- El nombre del repo es incorrecto
- Verifica la variable `GITHUB_REPO` o el default

### El cambio no se ve en otros dispositivos
- Refresca con `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
- Netlify puede tardar hasta 1 minuto en propagar el cambio

## Cómo revocar el token

Si quieres desactivar la sincronización automática:

1. Abre https://github.com/settings/tokens
2. Busca `Mega Fragancia Netlify Function`
3. Click en **"Delete"**

A partir de ese momento, el admin seguirá guardando localmente, pero no se sincronizará a GitHub.

## Sobre la seguridad

- El token vive en Netlify (no en tu código, no en GitHub, no en el navegador del cliente)
- Solo tú (el dueño del repo) puede verlo desde el dashboard de Netlify
- El cliente final no tiene acceso al token en ningún momento
- Netlify cifra las variables de entorno en reposo

## ⚠️ Importante

**NUNCA** pegues el token en:
- El código del repo
- localStorage del navegador
- Un mensaje de chat o email

Solo debe estar en la variable de entorno de Netlify.

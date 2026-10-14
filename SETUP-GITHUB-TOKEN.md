# Cómo configurar el GitHub Personal Access Token

El panel admin de Mega Fragancia usa un token de GitHub para subir cambios automáticamente a `data.json` cuando el cliente guarda algo (productos, promos, textos). Esto hace que **todos los dispositivos vean los cambios al instante** sin que tengas que tocar GitHub.

## Paso 1 — Crear el token en GitHub

1. Abre https://github.com/settings/tokens/new
2. Inicia sesión con tu cuenta `andrescuesta19`
3. Llena el formulario:
   - **Note (descripción):** `Mega Fragancia admin`
   - **Expiration:** `No expiration` (o 1 año si prefieres renovar)
4. En **"Select scopes"**, marca SOLO esta casilla:
   - ✅ **`repo`** (acceso completo a repositorios privados)
5. Click en **"Generate token"**
6. **Copia el token** que aparece (empieza con `github_pat_...` o `ghp_...`)

⚠️ **Importante:** GitHub solo te muestra el token UNA vez. Cópialo ahora.

## Paso 2 — Pegar el token en el sitio

Hay 2 opciones. Te recomiendo la **opción A** (más simple):

### Opción A: Pegarlo directamente en el código

1. Abre `app.js` en tu editor
2. Busca la línea que dice `var GITHUB_TOKEN = '';`
3. Pega tu token entre las comillas:
   ```js
   var GITHUB_TOKEN = 'github_pat_xxxxxxxxxxxxxxxxxxxx';
   ```
4. Guarda el archivo
5. Sube el cambio a GitHub (`git add . && git commit -m "Add token" && git push`)

**⚠️ Riesgo de seguridad:** el token queda en el código del repo. Como el repo es **privado**, esto es aceptable. Pero si alguna vez el repo se hace público, **cambia el token inmediatamente**.

### Opción B: Que el cliente lo ingrese la primera vez

1. El cliente abre el sitio por primera vez
2. Hace clic en el engranaje ⚙ del header
3. Aparece un campo "Token de GitHub"
4. Pega el token ahí
5. Se guarda en `localStorage` del navegador
6. A partir de ahí, todos los "Guardar" suben a GitHub automáticamente

**Ventaja:** no hay token en el código del repo.
**Desventaja:** el token se pierde si el cliente borra el caché del navegador.

## Paso 3 — Verificar que funciona

1. Abre el sitio en tu navegador
2. Entra al panel admin (⚙, clave `mega2026`)
3. Cambia algo, por ejemplo el texto de la promo
4. Click en "Guardar"
5. Espera 5-10 segundos
6. Verás un mensaje: "✓ Guardado y sincronizado con GitHub"
7. Abre el sitio en otro dispositivo o en una ventana de incógnito
8. El cambio debe verse

## Si algo falla

### El token no funciona
- Verifica que el token no haya expirado
- Verifica que tenga el scope `repo` marcado
- Genera uno nuevo y reemplázalo

### El cambio no se ve en otros dispositivos
- Refresca con `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
- El archivo `data.json` puede tardar hasta 1 minuto en propagarse por la CDN de Netlify

### Error 401 (no autorizado)
- El token es incorrecto o fue revocado
- Genera uno nuevo

### Error 404 (no encontrado)
- El repo no existe o el nombre es incorrecto
- Verifica que `GITHUB_REPO` en `app.js` sea `andrescuesta19/megafragancia-web`

## Cómo revocar el token

Si en algún momento quieres desactivar la sincronización automática:

1. Abre https://github.com/settings/tokens
2. Busca el token `Mega Fragancia admin`
3. Click en **"Delete"**

A partir de ese momento, los "Guardar" en el panel admin mostrarán un error de autenticación, pero el sitio seguirá funcionando con los datos que ya tiene.

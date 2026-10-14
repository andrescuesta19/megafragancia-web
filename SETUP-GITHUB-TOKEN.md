# Cómo configurar el GitHub Personal Access Token

El panel admin de Mega Fragancia usa un token de GitHub para subir cambios automáticamente a `data.json` cuando el cliente guarda algo (productos, promos, textos). Esto hace que **todos los dispositivos vean los cambios al instante** sin que tengas que tocar GitHub.

## ⚠️ Importante

**El token NO va en el código del repositorio.** GitHub tiene una protección automática llamada "Push Protection" que rechaza commits con tokens. El token se ingresa desde la UI del panel admin y se guarda en `localStorage` del navegador (solo en ese dispositivo).

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

## Paso 2 — Pegar el token en el sitio (UNA SOLA VEZ)

1. Abre el sitio en tu navegador: `https://[nombre].netlify.app`
2. Click en el ícono de engranaje ⚙ (esquina superior derecha)
3. Ingresa la clave `mega2026` y dale Enter
4. En el panel admin, busca la sección plegable **"🔑 Configurar token de GitHub"**
5. Click en ella para expandir
6. Pega tu token en el campo
7. Click en **"Guardar token"**
8. Debe aparecer "✓ Token guardado. Ya puedes sincronizar."

El token queda guardado en `localStorage` de tu navegador. **No se sube a GitHub ni se expone en ningún lado.**

## Paso 3 — Probar que funciona

1. En el mismo panel admin, cambia algo, por ejemplo el texto de la promo
2. Click en "Guardar"
3. Espera 5-10 segundos
4. Debe aparecer "✓ Guardado y sincronizado"
5. Abre el sitio en otro dispositivo (celular, otro computador) o en una ventana de incógnito
6. Refresca con `Cmd + Shift + R` (Mac) o `Ctrl + Shift + R` (Windows)
7. El cambio debe verse

## Si algo falla

### "⚠ Guardado local. Error: ..."
- El token puede ser incorrecto
- Verifica que lo pegaste completo (son ~80 caracteres)
- Verifica que tenga el scope `repo` marcado

### El cambio no se ve en otros dispositivos
- Refresca con `Ctrl + Shift + R` (o `Cmd + Shift + R` en Mac)
- El archivo `data.json` puede tardar hasta 1 minuto en propagarse por la CDN de Netlify

### Error 401 (no autorizado)
- El token es incorrecto, expiró o fue revocado
- Genera uno nuevo en https://github.com/settings/tokens/new

### Error 404 (no encontrado)
- El repo no existe o el nombre es incorrecto
- Verifica que el repo es `andrescuesta19/megafragancia-web` y que tienes acceso

## Cómo revocar el token (si lo pierdes o quieres desactivarlo)

1. Abre https://github.com/settings/tokens
2. Busca el token `Mega Fragancia admin`
3. Click en **"Delete"**

A partir de ese momento, los "Guardar" en el panel admin mostrarán error de autenticación, pero el sitio seguirá funcionando con los datos que ya tiene.

## Si borraste el caché del navegador

Si se borra el `localStorage` (al limpiar datos del navegador), el token se pierde. Solo tienes que volver a hacer el Paso 2 (pegar el token de nuevo).

## ⚠️ Sobre la seguridad

- El token queda en `localStorage` del navegador. **Cualquier persona con acceso físico a tu computador puede ver el token** abriendo DevTools → Application → Local Storage.
- Si el computador lo usan varias personas, cierra sesión del admin después de usarlo.
- El token da acceso completo al repo. Trátalo como una contraseña.
- Si sospechas que el token está comprometido, revócalo inmediatamente en https://github.com/settings/tokens y crea uno nuevo.

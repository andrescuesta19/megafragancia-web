# Configuración de Supabase para Mega Fragancia

Esta guía te lleva de cero a tener el sitio funcionando con base de datos, autenticación y almacenamiento de fotos/videos en la nube.

---

## Lo que vas a obtener

- ✅ **Base de datos PostgreSQL** en la nube (gratis hasta 500MB)
- ✅ **Almacenamiento de fotos y videos** (gratis hasta 1GB)
- ✅ **Autenticación** con email/contraseña para el admin
- ✅ **Sincronización automática** entre todos los dispositivos
- ✅ **Sin tocar GitHub** nunca más para cambios de productos

---

## Paso 1 — Crear cuenta y proyecto en Supabase (3 minutos)

1. Ve a https://supabase.com
2. Click en **"Start your project"**
3. Regístrate con tu email o con GitHub
4. Una vez logueado, click en **"New project"**
5. Llena:
   - **Name:** `mega-fragancia`
   - **Database Password:** (genera una, guárdala)
   - **Region:** `South America (São Paulo)` (más cercano a Colombia)
6. Click **"Create new project"**
7. Espera 1-2 minutos mientras se crea

---

## Paso 2 — Crear las tablas (2 minutos)

1. En el dashboard de Supabase, ve a **SQL Editor** (icono de la izquierda)
2. Click en **"New query"**
3. Abre el archivo `SUPABASE-SETUP.sql` que está en este repo
4. **Copia TODO el contenido** y pégalo en el editor SQL
5. Click en **"Run"** (o Ctrl/Cmd + Enter)
6. Debe decir "Success. No rows returned" — eso significa que todo se creó bien

Si te pide confirmación para crear políticas, dile que sí.

---

## Paso 3 — Crear el bucket de Storage (1 minuto)

1. En el dashboard, ve a **Storage** (icono de la izquierda)
2. Click en **"New bucket"**
3. Llena:
   - **Name:** `media` (en minúsculas, exactamente así)
   - **Public bucket:** ✅ **Marcado** (para que las fotos sean accesibles públicamente)
4. Click **"Create bucket"**

---

## Paso 4 — Crear el usuario admin (1 minuto)

1. Ve a **Authentication** → **Users** (icono de la izquierda)
2. Click en **"Add user"** → **"Create new user"**
3. Llena:
   - **Email:** el que quieras (ej: `admin@tu-dominio.com`)
   - **Password:** una contraseña segura (mínimo 6 caracteres)
   - **Auto Confirm User:** ✅ Marcado
4. Click **"Create user"**
5. **Guarda el email y contraseña** — los vas a necesitar para entrar al admin

---

## Paso 5 — Obtener las credenciales (1 minuto)

1. En el dashboard, ve a **Settings** (icono del engranaje) → **API**
2. Verás dos valores que necesitas:
   - **Project URL:** algo como `https://abcdefgh.supabase.co`
   - **anon public key:** una cadena larga que empieza con `eyJ...`
3. **Copia ambos**

---

## Paso 6 — Configurar el sitio (2 minutos)

1. Abre el archivo `supabase-config.js` que está en el repo
2. Pega los valores:

```js
window.SUPABASE_CONFIG = {
  url: 'https://abcdefgh.supabase.co',  // ← tu Project URL
  anonKey: 'eyJ...',                    // ← tu anon public key
  adminEmail: 'admin@tu-dominio.com',  // ← el email que creaste
  adminPassword: 'tu-password'           // ← la contraseña
};
```

3. Guarda el archivo
4. Si editaste localmente: `git add . && git commit -m "Configure Supabase" && git push`
5. Netlify redesplega automáticamente

---

## Paso 7 — Probar (2 minutos)

1. Espera 1-2 minutos a que Netlify redespliegue
2. Abre el sitio: `https://[nombre].netlify.app`
3. Click en el engranaje ⚙ (esquina superior derecha)
4. Aparece el formulario de login
5. Ingresa el **email y contraseña** que creaste en el Paso 4
6. Click **"Entrar"**
7. Ya estás en el panel admin
8. Ve a la pestaña **"Productos"** → click **"➕ Agregar nuevo producto"**
9. Llena el nombre, precio, descripción
10. **Sube 2 o 3 fotos** (puedes seleccionar varias a la vez)
11. Click **"Agregar producto"**
12. Espera 5-10 segundos
13. La página se actualiza y ves el producto con sus fotos
14. **Abre el sitio en otro dispositivo** (celular, otro computador)
15. El producto debe verse ahí también

---

## Funcionalidades disponibles

### En el admin puedes:

- **Productos:** agregar, editar, eliminar. Cada producto puede tener **múltiples fotos y videos**
- **Promo:** activar/desactivar, cambiar título, subtítulo, vigencia, precio del combo
- **Textos:** editar el título del hero, descripción, texto de "Nosotros", URL de Instagram
- **Sesión:** cerrar sesión con el botón de la esquina superior derecha del admin

### El cliente (no técnico) puede:

- Tomar fotos con el celular → subirlas desde el admin → verlas en todos los dispositivos
- Cambiar el texto de la promo cuando cambia el mes
- Agregar productos nuevos sin tocar código

---

## Si algo falla

### "Error cargando datos: ..."

- Verifica que el `supabase-config.js` tiene los valores correctos
- Verifica que ejecutaste el SQL completo del archivo `SUPABASE-SETUP.sql`
- Abre la consola del navegador (F12) y mira el error exacto

### "Email o contraseña incorrectos"

- Verifica que el email y contraseña son los mismos que creaste en Supabase → Authentication → Users
- Si la contraseña la pusiste en `supabase-config.js`, asegúrate de que coincida

### Las fotos no se suben

- Verifica que el bucket se llama exactamente `media` (en minúsculas)
- Verifica que está marcado como **público** (Public bucket)
- Si sale "new row violates row-level security", ejecuta de nuevo el SQL del Paso 2

### El sitio se ve raro / los productos no cargan

- Abre la consola del navegador (F12 → Console)
- Si ves "Supabase no está configurado", revisa el `supabase-config.js`
- Si ves errores de CORS, verifica que el dominio de Netlify está en la lista permitida en Supabase → Settings → API

---

## Límites del plan gratuito

- **Storage:** 1 GB (más que suficiente para ~500 fotos de productos)
- **Database:** 500 MB
- **Transferencia:** 2 GB/mes (más que suficiente para una tienda)
- **Usuarios autenticados:** 50,000/mes

Si llegas a estos límites (que no va a pasar con una tienda pequeña), Supabase te avisa y puedes升级 al plan Pro ($25/mes) cuando lo necesites.

---

## Cómo cambiar la contraseña del admin después

1. Ve a Supabase → Authentication → Users
2. Click en el usuario
3. **"Reset password"** o **"Update password"**
4. Cambia también el valor en `supabase-config.js` si lo dejaste hardcodeado

---

## Sobre la seguridad

- La `anon public key` es segura de exponer (es para eso, "public")
- Las políticas RLS (Row Level Security) en Supabase garantizan que:
  - Cualquier persona puede **leer** productos y configuración (público)
  - Solo usuarios autenticados pueden **modificar** (protegido)
- La contraseña del admin **NO se guarda en el código** si la dejas vacía en `supabase-config.js` (queda solo en Supabase)
- El cliente nunca tiene acceso al panel admin a menos que tú le crees un usuario

---

## Resumen del flujo

```
Tú (desarrollador) creas el proyecto en Supabase
        ↓
Ejecutas el SQL una sola vez
        ↓
Creas el usuario admin
        ↓
Pegas las credenciales en supabase-config.js
        ↓
Subes a GitHub
        ↓
El cliente abre el admin en su celular
        ↓
Toma fotos, llena el form, click "Guardar"
        ↓
Las fotos van a Supabase Storage
        ↓
Los datos van a Supabase Database
        ↓
TODOS los dispositivos ven el cambio
        ↓
Cero GitHub, cero commits, cero deploys manuales
```

¡Listo! El sistema queda 100% automático.

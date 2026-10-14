// Configuración de Supabase
// =====================================================
// INSTRUCCIONES:
// 1. Crea un proyecto en https://supabase.com (gratis)
// 2. Ve a Settings → API
// 3. Copia los valores de "Project URL" y "anon public" key
// 4. Pégalos abajo entre las comillas
// 5. Ejecuta el archivo SUPABASE-SETUP.sql en el SQL Editor de Supabase
// 6. Crea el bucket de Storage llamado "media" (público)
// 7. Crea un usuario en Authentication → Users con email y password
// =====================================================

window.SUPABASE_CONFIG = {
  // Project URL (ejemplo: https://abcdefgh.supabase.co)
  url: 'https://TU-PROYECTO.supabase.co',

  // anon public key (es una cadena larga que empieza con "eyJ...")
  anonKey: 'TU-ANON-KEY-AQUI',

  // Email del admin (lo creas en Authentication → Users)
  adminEmail: 'admin@tu-dominio.com',

  // Password del admin
  adminPassword: 'tu-password-seguro'
};

-- =====================================================
-- MEGA FRAGANCIA - Schema de Supabase
-- =====================================================
-- Ejecuta este SQL UNA sola vez en tu proyecto de Supabase.
-- Ve a: https://app.supabase.com → SQL Editor → New query
-- Pega todo este archivo y dale "Run"
-- =====================================================

-- 1. Habilitar la extensión para generar UUIDs
create extension if not exists "uuid-ossp";

-- =====================================================
-- TABLA: productos
-- =====================================================
create table if not exists public.productos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo text not null check (tipo in ('Hombre', 'Mujer', 'Unisex')),
  descripcion text default '',
  precio integer default 0,
  presentacion text default '',
  notas_salida text[] default '{}',
  notas_corazon text[] default '{}',
  notas_fondo text[] default '{}',
  color_h integer default 38 check (color_h >= 0 and color_h <= 360),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  activo boolean default true
);

-- =====================================================
-- TABLA: producto_media (fotos y videos por producto)
-- =====================================================
create table if not exists public.producto_media (
  id uuid primary key default uuid_generate_v4(),
  producto_id uuid not null references public.productos(id) on delete cascade,
  url text not null,
  tipo text not null check (tipo in ('imagen', 'video')),
  es_portada boolean default false,
  orden integer default 0,
  created_at timestamp with time zone default now()
);

-- =====================================================
-- TABLA: site_config (textos editables del sitio)
-- =====================================================
create table if not exists public.site_config (
  clave text primary key,
  valor text not null,
  updated_at timestamp with time zone default now()
);

-- Insertar valores por defecto
insert into public.site_config (clave, valor) values
  ('hero_h1', 'Perfumes árabes<br>y de nicho · <em>100% originales</em>'),
  ('hero_lead', 'Elige tus fragancias, arma tu combo y paga solo cuando lo recibes. Trabajamos directamente con proveedores autorizados y entregamos factura de cada pedido.'),
  ('nosotros_texto', 'Mega Fragancia es un emprendimiento colombiano dedicado a la curaduría de perfumes árabes y de nicho. Seleccionamos cada fragancia con proveedores autorizados y la probamos antes de ofrecerla, porque sabemos que un buen perfume es una decisión personal.' || E'\n\n' || 'Estamos en Turbo, Antioquia y enviamos a todo el país. Si quieres conocer la procedencia exacta de cualquier producto, te la mostramos: factura, lote y video del empaque.'),
  ('instagram', 'https://www.instagram.com/mega.fragancia7/'),
  ('whatsapp', '573106399810'),
  ('promo_activo', 'true'),
  ('promo_titulo', '2× $300.000'),
  ('promo_subtitulo', 'Combo de octubre'),
  ('promo_vigencia', 'Cantidad limitada'),
  ('promo_precio', '300000')
on conflict (clave) do nothing;

-- =====================================================
-- ÍNDICES
-- =====================================================
create index if not exists idx_producto_media_producto on public.producto_media(producto_id, orden);
create index if not exists idx_productos_activo on public.productos(activo, created_at desc);

-- =====================================================
-- STORAGE: bucket para las imágenes
-- =====================================================
-- Esto se crea en el dashboard de Supabase (Storage → New bucket)
-- Nombre del bucket: 'media'
-- Public bucket: SÍ (para que se pueda acceder a las imágenes sin auth)
-- Después de crearlo, ejecuta esto para configurar las políticas:

-- Política: cualquier persona puede ver las imágenes (lectura pública)
create policy "Public read access"
  on storage.objects for select
  using ( bucket_id = 'media' );

-- Política: solo usuarios autenticados pueden subir
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

-- Política: solo usuarios autenticados pueden actualizar
create policy "Authenticated users can update"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

-- Política: solo usuarios autenticados pueden eliminar
create policy "Authenticated users can delete"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and auth.role() = 'authenticated'
  );

-- =====================================================
-- RLS (Row Level Security) en las tablas
-- =====================================================
-- Activar RLS
alter table public.productos enable row level security;
alter table public.producto_media enable row level security;
alter table public.site_config enable row level security;

-- Política de lectura: cualquier persona puede leer
create policy "Public read productos" on public.productos for select using (true);
create policy "Public read producto_media" on public.producto_media for select using (true);
create policy "Public read site_config" on public.site_config for select using (true);

-- Política de escritura: solo usuarios autenticados
create policy "Auth write productos" on public.productos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth write producto_media" on public.producto_media for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth write site_config" on public.site_config for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- =====================================================
-- USUARIO ADMIN
-- =====================================================
-- Crear el usuario admin se hace desde Authentication → Users
-- Email: admin@tu-dominio.com (o el que quieras)
-- Password: la que quieras (mínimo 6 caracteres)
-- Después de crearlo, en Authentication → Users, cópiale el User UID
-- y úsalo en tu código.

-- =====================================================
-- DATOS DE EJEMPLO (opcional, puedes borrar lo que no quieras)
-- =====================================================
insert into public.productos (nombre, tipo, descripcion, precio, presentacion, notas_salida, notas_corazon, notas_fondo, color_h) values
  ('Ámbar Real', 'Unisex', 'Cálido, especiado y envolvente. Ideal para noches frescas.', 150000, '100 ml', ARRAY['Cardamomo', 'Bergamota'], ARRAY['Ámbar', 'Rosa'], ARRAY['Vainilla', 'Pachulí'], 38),
  ('Oud Nocturno', 'Hombre', 'Profundo, ahumado y elegante. Un clásico de la perfumería árabe.', 180000, '100 ml', ARRAY['Azafrán', 'Pimienta'], ARRAY['Oud', 'Cuero'], ARRAY['Sándalo', 'Almizcle'], 260),
  ('Rosa del Desierto', 'Mujer', 'Floral, dulce y sofisticado. Para quien deja huella.', 150000, '100 ml', ARRAY['Frambuesa', 'Litchi'], ARRAY['Rosa damascena', 'Peonía'], ARRAY['Almizcle', 'Ámbar'], 340),
  ('Noche de Dátil', 'Unisex', 'Gourmand, oriental y memorable. Perfecto para regalar.', 165000, '100 ml', ARRAY['Dátil', 'Canela'], ARRAY['Haba tonka', 'Café'], ARRAY['Vainilla', 'Madera'], 28),
  ('Atlas Fresco', 'Hombre', 'Aromático, limpio y versátil. Para el día a día.', 140000, '100 ml', ARRAY['Limón', 'Menta'], ARRAY['Lavanda', 'Salvia'], ARRAY['Vetiver', 'Cedro'], 200),
  ('Jazmín Dorado', 'Mujer', 'Floral blanco, solar y sofisticado. Elegancia en cada nota.', 155000, '100 ml', ARRAY['Mandarina', 'Pera'], ARRAY['Jazmín', 'Azahar'], ARRAY['Sándalo', 'Vainilla'], 48)
on conflict do nothing;

-- =====================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- =====================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

drop trigger if exists update_productos_updated_at on public.productos;
create trigger update_productos_updated_at
  before update on public.productos
  for each row execute function update_updated_at_column();

drop trigger if exists update_site_config_updated_at on public.site_config;
create trigger update_site_config_updated_at
  before update on public.site_config
  for each row execute function update_updated_at_column();

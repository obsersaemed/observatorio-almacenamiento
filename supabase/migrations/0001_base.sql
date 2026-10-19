-- 0001 · Plataforma base del Observatorio de Almacenamiento de Energía (spec 001).
-- Las columnas, valores permitidos y rangos reflejan datos/esquemas.json; la prueba
-- pruebas/test_sql_esquemas.py verifica que coincidan. Nombres con columna_sql().
-- Regla central: el público solo lee lo aprobado y solo propone en `aportes`.

-- ------------------------------------------------------------------ Editores
create table public.editores (
  correo text primary key check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nombre text,
  creado_en timestamptz not null default now()
);

create function public.es_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.editores
    where lower(correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ----------------------------------------------------------------- Proyectos
create table public.proyectos (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  operador text,
  estado text not null check (estado in ('En operación', 'En construcción', 'Anunciado', 'Inactivo')),
  tecnologia text,
  fpo text,
  tipo_uso_conexion text,
  punto_de_conexion_kv numeric check (punto_de_conexion_kv >= 0 and punto_de_conexion_kv <= 500),
  departamento text not null,
  municipio text not null,
  latitud numeric check (latitud >= -4.3 and latitud <= 13.5),
  longitud numeric check (longitud >= -82 and longitud <= -66.8),
  potencia_nominal_mw numeric check (potencia_nominal_mw >= 0),
  capacidad_maxima_mwh numeric check (capacidad_maxima_mwh >= 0),
  potencia_maxima_de_descarga_mw numeric check (potencia_maxima_de_descarga_mw >= 0),
  potencia_maxima_de_carga_mw numeric check (potencia_maxima_de_carga_mw >= 0),
  estado_de_carga_minimo_tecnico numeric check (estado_de_carga_minimo_tecnico >= 0 and estado_de_carga_minimo_tecnico <= 100),
  eficiencia_minima numeric check (eficiencia_minima >= 0 and eficiencia_minima <= 100),
  eficiencia_de_carga numeric check (eficiencia_de_carga >= 0 and eficiencia_de_carga <= 100),
  eficiencia_de_descarga numeric check (eficiencia_de_descarga >= 0 and eficiencia_de_descarga <= 100),
  eficiencia_de_almacenamiento numeric check (eficiencia_de_almacenamiento >= 0 and eficiencia_de_almacenamiento <= 100),
  tiempo_para_aporte_de_maxima_potencia text,
  tipo_de_compensacion_adicional text,
  fuente text not null check (fuente ~ '^https?://'),
  publicacion text not null default 'Pendiente' check (publicacion in ('Pendiente', 'Aprobado', 'Rechazado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- -------------------------------------------------------------------- Normas
create table public.normas (
  id text not null primary key,
  fecha date not null,
  emisor text not null check (emisor in ('CREG', 'MME', 'CNO', 'UPME', 'XM', 'Congreso')),
  tipo text not null check (tipo in ('Ley', 'Decreto', 'Resolución', 'Proyecto de resolución', 'Acuerdo', 'Circular', 'Documento')),
  numero text not null,
  titulo text not null,
  estado text not null check (estado in ('Vigente', 'Modificada', 'Derogada', 'En consulta')),
  resumen text,
  explicacion text,
  aplica_a text,
  relacionada_con text,
  enlace text not null check (enlace ~ '^https?://'),
  publicacion text not null default 'Pendiente' check (publicacion in ('Pendiente', 'Aprobado', 'Rechazado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------------ Noticias
create table public.noticias (
  id bigint generated always as identity primary key,
  fecha date not null,
  titulo text not null,
  medio text not null,
  enlace text not null unique check (enlace ~ '^https?://'),
  resumen text,
  etiquetas text,
  proyecto_relacionado text,
  norma_relacionada text,
  publicacion text not null default 'Pendiente' check (publicacion in ('Pendiente', 'Aprobado', 'Rechazado')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------- Aportes (cola de moderación)
-- El id es el número de seguimiento que ve quien aporta.
create table public.aportes (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('Proyecto nuevo', 'Corrección', 'Noticia', 'Norma')),
  registro_afectado text,
  descripcion text not null,
  datos jsonb not null default '{}'::jsonb,
  fuente text not null check (fuente ~ '^https?://'),
  origen text not null check (origen in ('usuario', 'agente', 'editor')),
  agente text,
  publicacion text not null default 'Pendiente' check (publicacion in ('Pendiente', 'Aprobado', 'Rechazado')),
  motivo text,
  origen_hash text,
  creado_en timestamptz not null default now(),
  revisado_en timestamptz,
  revisado_por text,
  constraint correccion_con_registro check (tipo <> 'Corrección' or registro_afectado is not null),
  constraint agente_con_nombre check (origen <> 'agente' or agente is not null),
  constraint rechazo_con_motivo check (publicacion <> 'Rechazado' or motivo is not null)
);
create index aportes_pendientes on public.aportes (publicacion, creado_en);
create index aportes_origen_hash on public.aportes (origen_hash, creado_en);

-- Correo de quien aporta: privado, nunca se publica ni se exporta (RNF-10).
create table public.aportantes (
  aporte_id bigint primary key references public.aportes (id) on delete cascade,
  correo text not null check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- ----------------------------------------------------------------- Historial
create table public.historial (
  id bigint generated always as identity primary key,
  tabla text not null,
  registro text not null,
  operacion text not null check (operacion in ('INSERT', 'UPDATE', 'DELETE')),
  antes jsonb,
  despues jsonb,
  fuente text,
  editor text,
  aporte_id bigint,
  creado_en timestamptz not null default now()
);
create index historial_registro on public.historial (tabla, registro, creado_en);

-- La aprobación fija app.editor y app.aporte_id en la transacción (set_config) para
-- que el historial sepa quién aprobó y desde qué aporte. TG_ARGV[0] = columna clave.
create function public.registrar_historial() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  fila jsonb := to_jsonb(coalesce(new, old));
begin
  if tg_op = 'UPDATE' then
    new.actualizado_en := now();
    fila := to_jsonb(new);
  end if;
  insert into public.historial (tabla, registro, operacion, antes, despues, fuente, editor, aporte_id)
  values (
    tg_table_name,
    fila ->> tg_argv[0],
    tg_op,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else fila end,
    coalesce(fila ->> 'fuente', fila ->> 'enlace'),
    nullif(current_setting('app.editor', true), ''),
    nullif(current_setting('app.aporte_id', true), '')::bigint
  );
  return coalesce(new, old);
end;
$$;

create trigger historial_proyectos before insert or update or delete on public.proyectos
  for each row execute function public.registrar_historial('nombre');
create trigger historial_normas before insert or update or delete on public.normas
  for each row execute function public.registrar_historial('id');
create trigger historial_noticias before insert or update or delete on public.noticias
  for each row execute function public.registrar_historial('enlace');

-- ----------------------------------------------------------------------- RLS
alter table public.editores enable row level security;
alter table public.proyectos enable row level security;
alter table public.normas enable row level security;
alter table public.noticias enable row level security;
alter table public.aportes enable row level security;
alter table public.aportantes enable row level security;
alter table public.historial enable row level security;

-- Tablas publicables: el público lee lo aprobado; los editores leen y escriben todo.
create policy "publico lee proyectos aprobados" on public.proyectos
  for select to anon, authenticated using (publicacion = 'Aprobado');
create policy "editores gestionan proyectos" on public.proyectos
  for all to authenticated using (public.es_editor()) with check (public.es_editor());

create policy "publico lee normas aprobadas" on public.normas
  for select to anon, authenticated using (publicacion = 'Aprobado');
create policy "editores gestionan normas" on public.normas
  for all to authenticated using (public.es_editor()) with check (public.es_editor());

create policy "publico lee noticias aprobadas" on public.noticias
  for select to anon, authenticated using (publicacion = 'Aprobado');
create policy "editores gestionan noticias" on public.noticias
  for all to authenticated using (public.es_editor()) with check (public.es_editor());

-- Aportes: cualquiera propone como usuario y en estado Pendiente; no puede leer la cola.
create policy "publico propone aportes" on public.aportes
  for insert to anon, authenticated
  with check (publicacion = 'Pendiente' and origen = 'usuario' and motivo is null
              and revisado_en is null and revisado_por is null);
create policy "editores gestionan aportes" on public.aportes
  for all to authenticated using (public.es_editor()) with check (public.es_editor());

-- Privadas: solo editores leen. Las escrituras van por el servidor (llave de servicio).
create policy "editores leen aportantes" on public.aportantes
  for select to authenticated using (public.es_editor());
create policy "editores leen historial" on public.historial
  for select to authenticated using (public.es_editor());
create policy "editores leen editores" on public.editores
  for select to authenticated using (public.es_editor());

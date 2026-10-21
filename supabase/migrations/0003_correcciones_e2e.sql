-- 0003 · Correcciones del informe E2E de la spec 001.
-- T18 (CA-11.1): el historial cita la fuente del aporte que justificó el cambio.
-- T20 (CA-16.1): la base rechaza los valores con los mismos mensajes que la web y la
--                importación (bloque generado desde datos/esquemas.json, al final).

-- ------------------------------------------------- T18 · fuente del cambio en el historial
-- Igual que en 0001, pero la fuente es la del aporte (app.fuente, fijada por aplicar_aporte)
-- y, si no hay aporte, la del propio registro.
create or replace function public.registrar_historial() returns trigger
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
    coalesce(nullif(current_setting('app.fuente', true), ''), fila ->> 'fuente', fila ->> 'enlace'),
    nullif(current_setting('app.editor', true), ''),
    nullif(current_setting('app.aporte_id', true), '')::bigint
  );
  return coalesce(new, old);
end;
$$;

-- Igual que en 0002, más app.fuente = fuente del aporte.
create or replace function public.aplicar_aporte(p_aporte_id bigint, p_datos jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_aporte public.aportes%rowtype;
  v_editor text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_tabla text;
  v_clave text;
  v_columnas text;
  v_filas integer;
begin
  if not public.es_editor() then
    raise exception 'Solo los editores pueden aprobar aportes' using errcode = '42501';
  end if;

  select * into v_aporte from public.aportes where id = p_aporte_id for update;
  if not found then
    raise exception 'El aporte % no existe', p_aporte_id;
  end if;
  if v_aporte.publicacion <> 'Pendiente' then
    raise exception 'El aporte % ya fue revisado (%)', p_aporte_id, v_aporte.publicacion;
  end if;

  v_tabla := case
    when v_aporte.tipo = 'Noticia' then 'noticias'
    when v_aporte.tipo = 'Norma' then 'normas'
    when v_aporte.tipo = 'Corrección' and v_aporte.datos ->> 'tabla' in ('normas', 'noticias') then v_aporte.datos ->> 'tabla'
    else 'proyectos'
  end;
  v_clave := case v_tabla when 'proyectos' then 'nombre' when 'normas' then 'id' else 'enlace' end;

  select string_agg(quote_ident(c.column_name), ', ') into v_columnas
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = v_tabla
    and p_datos ? c.column_name
    and c.column_name not in ('publicacion', 'creado_en', 'actualizado_en')
    and not (v_tabla in ('proyectos', 'noticias') and c.column_name = 'id');
  if v_columnas is null then
    raise exception 'El aporte no trae campos válidos para %', v_tabla;
  end if;

  perform set_config('app.editor', v_editor, true);
  perform set_config('app.aporte_id', p_aporte_id::text, true);
  perform set_config('app.fuente', v_aporte.fuente, true);

  if v_aporte.tipo = 'Corrección' then
    if v_aporte.registro_afectado is null then
      raise exception 'La corrección no indica el registro afectado';
    end if;
    execute format(
      'update public.%I set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1)) where %I = $2',
      v_tabla, v_columnas, v_columnas, v_tabla, v_clave
    ) using p_datos, v_aporte.registro_afectado;
    get diagnostics v_filas = row_count;
    if v_filas <> 1 then
      raise exception 'No se encontró el registro "%" en %', v_aporte.registro_afectado, v_tabla;
    end if;
  else
    execute format(
      'insert into public.%I (%s, publicacion) select %s, ''Aprobado'' from jsonb_populate_record(null::public.%I, $1)',
      v_tabla, v_columnas, v_columnas, v_tabla
    ) using p_datos;
  end if;

  update public.aportes
  set publicacion = 'Aprobado', datos_aprobados = p_datos, revisado_en = now(), revisado_por = v_editor
  where id = p_aporte_id;
end;
$$;

revoke execute on function public.aplicar_aporte(bigint, jsonb) from public, anon;
grant execute on function public.aplicar_aporte(bigint, jsonb) to authenticated;

-- ------------------------------------------------- T20 · mismos mensajes en la base
-- >>> validación generada desde datos/esquemas.json con scripts/generar_validacion_sql.py (no editar a mano)

create or replace function public.validar_proyectos() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.nombre is null or btrim(new.nombre::text) = '' then raise exception using errcode = '23514', message = '''Nombre'' es obligatorio'; end if;
  if new.estado is null or btrim(new.estado::text) = '' then raise exception using errcode = '23514', message = '''Estado'' es obligatorio'; end if;
  if new.estado is not null and new.estado not in ('En operación', 'En construcción', 'Anunciado', 'Inactivo') then raise exception using errcode = '23514', message = format('''Estado'' = ''%s'' no está entre los valores permitidos: En operación, En construcción, Anunciado, Inactivo', new.estado); end if;
  if new.punto_de_conexion_kv is not null and (new.punto_de_conexion_kv < 0 or new.punto_de_conexion_kv > 500) then raise exception using errcode = '23514', message = format('''Punto de conexión kV'' = %s fuera de rango [0, 500]', new.punto_de_conexion_kv); end if;
  if new.departamento is null or btrim(new.departamento::text) = '' then raise exception using errcode = '23514', message = '''Departamento'' es obligatorio'; end if;
  if new.municipio is null or btrim(new.municipio::text) = '' then raise exception using errcode = '23514', message = '''Municipio'' es obligatorio'; end if;
  if new.latitud is not null and (new.latitud < -4.3 or new.latitud > 13.5) then raise exception using errcode = '23514', message = format('''Latitud'' = %s fuera de rango [-4.3, 13.5]', new.latitud); end if;
  if new.longitud is not null and (new.longitud < -82.0 or new.longitud > -66.8) then raise exception using errcode = '23514', message = format('''Longitud'' = %s fuera de rango [-82, -66.8]', new.longitud); end if;
  if new.potencia_nominal_mw is not null and (new.potencia_nominal_mw < 0) then raise exception using errcode = '23514', message = format('''Potencia nominal [MW]'' = %s fuera de rango [0, inf]', new.potencia_nominal_mw); end if;
  if new.capacidad_maxima_mwh is not null and (new.capacidad_maxima_mwh < 0) then raise exception using errcode = '23514', message = format('''Capacidad máxima [MWh]'' = %s fuera de rango [0, inf]', new.capacidad_maxima_mwh); end if;
  if new.potencia_maxima_de_descarga_mw is not null and (new.potencia_maxima_de_descarga_mw < 0) then raise exception using errcode = '23514', message = format('''Potencia máxima de descarga [MW]'' = %s fuera de rango [0, inf]', new.potencia_maxima_de_descarga_mw); end if;
  if new.potencia_maxima_de_carga_mw is not null and (new.potencia_maxima_de_carga_mw < 0) then raise exception using errcode = '23514', message = format('''Potencia máxima de carga [MW]'' = %s fuera de rango [0, inf]', new.potencia_maxima_de_carga_mw); end if;
  if new.estado_de_carga_minimo_tecnico is not null and (new.estado_de_carga_minimo_tecnico < 0 or new.estado_de_carga_minimo_tecnico > 100) then raise exception using errcode = '23514', message = format('''Estado de carga mínimo técnico [%]'' = %s fuera de rango [0, 100]', new.estado_de_carga_minimo_tecnico); end if;
  if new.eficiencia_minima is not null and (new.eficiencia_minima < 0 or new.eficiencia_minima > 100) then raise exception using errcode = '23514', message = format('''Eficiencia mínima [%]'' = %s fuera de rango [0, 100]', new.eficiencia_minima); end if;
  if new.eficiencia_de_carga is not null and (new.eficiencia_de_carga < 0 or new.eficiencia_de_carga > 100) then raise exception using errcode = '23514', message = format('''Eficiencia de carga [%]'' = %s fuera de rango [0, 100]', new.eficiencia_de_carga); end if;
  if new.eficiencia_de_descarga is not null and (new.eficiencia_de_descarga < 0 or new.eficiencia_de_descarga > 100) then raise exception using errcode = '23514', message = format('''Eficiencia de descarga [%]'' = %s fuera de rango [0, 100]', new.eficiencia_de_descarga); end if;
  if new.eficiencia_de_almacenamiento is not null and (new.eficiencia_de_almacenamiento < 0 or new.eficiencia_de_almacenamiento > 100) then raise exception using errcode = '23514', message = format('''Eficiencia de almacenamiento [%]'' = %s fuera de rango [0, 100]', new.eficiencia_de_almacenamiento); end if;
  if new.fuente is null or btrim(new.fuente::text) = '' then raise exception using errcode = '23514', message = '''Fuente'' es obligatorio'; end if;
  if new.fuente is not null and exists (select 1 from regexp_split_to_table(btrim(new.fuente), '\s+') as u where u <> '' and u !~ '^https?://\S+$') then raise exception using errcode = '23514', message = '''Fuente'' tiene algo que no es un enlace http(s)'; end if;
  return new;
end;
$$;
drop trigger if exists validar_proyectos on public.proyectos;
create trigger validar_proyectos before insert or update on public.proyectos
  for each row execute function public.validar_proyectos();

create or replace function public.validar_normas() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.id is null or btrim(new.id::text) = '' then raise exception using errcode = '23514', message = '''id'' es obligatorio'; end if;
  if new.fecha is null or btrim(new.fecha::text) = '' then raise exception using errcode = '23514', message = '''fecha'' es obligatorio'; end if;
  if new.emisor is null or btrim(new.emisor::text) = '' then raise exception using errcode = '23514', message = '''emisor'' es obligatorio'; end if;
  if new.emisor is not null and new.emisor not in ('CREG', 'MME', 'CNO', 'UPME', 'XM', 'Congreso') then raise exception using errcode = '23514', message = format('''emisor'' = ''%s'' no está entre los valores permitidos: CREG, MME, CNO, UPME, XM, Congreso', new.emisor); end if;
  if new.tipo is null or btrim(new.tipo::text) = '' then raise exception using errcode = '23514', message = '''tipo'' es obligatorio'; end if;
  if new.tipo is not null and new.tipo not in ('Ley', 'Decreto', 'Resolución', 'Proyecto de resolución', 'Acuerdo', 'Circular', 'Documento') then raise exception using errcode = '23514', message = format('''tipo'' = ''%s'' no está entre los valores permitidos: Ley, Decreto, Resolución, Proyecto de resolución, Acuerdo, Circular, Documento', new.tipo); end if;
  if new.numero is null or btrim(new.numero::text) = '' then raise exception using errcode = '23514', message = '''numero'' es obligatorio'; end if;
  if new.titulo is null or btrim(new.titulo::text) = '' then raise exception using errcode = '23514', message = '''titulo'' es obligatorio'; end if;
  if new.estado is null or btrim(new.estado::text) = '' then raise exception using errcode = '23514', message = '''estado'' es obligatorio'; end if;
  if new.estado is not null and new.estado not in ('Vigente', 'Modificada', 'Derogada', 'En consulta') then raise exception using errcode = '23514', message = format('''estado'' = ''%s'' no está entre los valores permitidos: Vigente, Modificada, Derogada, En consulta', new.estado); end if;
  if new.enlace is null or btrim(new.enlace::text) = '' then raise exception using errcode = '23514', message = '''enlace'' es obligatorio'; end if;
  if new.enlace is not null and exists (select 1 from regexp_split_to_table(btrim(new.enlace), '\s+') as u where u <> '' and u !~ '^https?://\S+$') then raise exception using errcode = '23514', message = '''enlace'' tiene algo que no es un enlace http(s)'; end if;
  return new;
end;
$$;
drop trigger if exists validar_normas on public.normas;
create trigger validar_normas before insert or update on public.normas
  for each row execute function public.validar_normas();

create or replace function public.validar_noticias() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.fecha is null or btrim(new.fecha::text) = '' then raise exception using errcode = '23514', message = '''fecha'' es obligatorio'; end if;
  if new.titulo is null or btrim(new.titulo::text) = '' then raise exception using errcode = '23514', message = '''titulo'' es obligatorio'; end if;
  if new.medio is null or btrim(new.medio::text) = '' then raise exception using errcode = '23514', message = '''medio'' es obligatorio'; end if;
  if new.enlace is null or btrim(new.enlace::text) = '' then raise exception using errcode = '23514', message = '''enlace'' es obligatorio'; end if;
  if new.enlace is not null and exists (select 1 from regexp_split_to_table(btrim(new.enlace), '\s+') as u where u <> '' and u !~ '^https?://\S+$') then raise exception using errcode = '23514', message = '''enlace'' tiene algo que no es un enlace http(s)'; end if;
  if new.publicacion is null or btrim(new.publicacion::text) = '' then raise exception using errcode = '23514', message = '''publicacion'' es obligatorio'; end if;
  if new.publicacion is not null and new.publicacion not in ('Pendiente', 'Aprobado', 'Rechazado') then raise exception using errcode = '23514', message = format('''publicacion'' = ''%s'' no está entre los valores permitidos: Pendiente, Aprobado, Rechazado', new.publicacion); end if;
  return new;
end;
$$;
drop trigger if exists validar_noticias on public.noticias;
create trigger validar_noticias before insert or update on public.noticias
  for each row execute function public.validar_noticias();

create or replace function public.validar_aportes() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.tipo is null or btrim(new.tipo::text) = '' then raise exception using errcode = '23514', message = '''tipo'' es obligatorio'; end if;
  if new.tipo is not null and new.tipo not in ('Proyecto nuevo', 'Corrección', 'Noticia', 'Norma') then raise exception using errcode = '23514', message = format('''tipo'' = ''%s'' no está entre los valores permitidos: Proyecto nuevo, Corrección, Noticia, Norma', new.tipo); end if;
  if new.descripcion is null or btrim(new.descripcion::text) = '' then raise exception using errcode = '23514', message = '''descripcion'' es obligatorio'; end if;
  if new.fuente is null or btrim(new.fuente::text) = '' then raise exception using errcode = '23514', message = '''fuente'' es obligatorio'; end if;
  if new.fuente is not null and exists (select 1 from regexp_split_to_table(btrim(new.fuente), '\s+') as u where u <> '' and u !~ '^https?://\S+$') then raise exception using errcode = '23514', message = '''fuente'' tiene algo que no es un enlace http(s)'; end if;
  if new.origen is null or btrim(new.origen::text) = '' then raise exception using errcode = '23514', message = '''origen'' es obligatorio'; end if;
  if new.origen is not null and new.origen not in ('usuario', 'agente', 'editor') then raise exception using errcode = '23514', message = format('''origen'' = ''%s'' no está entre los valores permitidos: usuario, agente, editor', new.origen); end if;
  if new.publicacion is null or btrim(new.publicacion::text) = '' then raise exception using errcode = '23514', message = '''publicacion'' es obligatorio'; end if;
  if new.publicacion is not null and new.publicacion not in ('Pendiente', 'Aprobado', 'Rechazado') then raise exception using errcode = '23514', message = format('''publicacion'' = ''%s'' no está entre los valores permitidos: Pendiente, Aprobado, Rechazado', new.publicacion); end if;
  return new;
end;
$$;
drop trigger if exists validar_aportes on public.aportes;
create trigger validar_aportes before insert or update on public.aportes
  for each row execute function public.validar_aportes();

-- <<< fin de la validación generada

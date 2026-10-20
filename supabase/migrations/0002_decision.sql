-- 0002 · Aprobación y rechazo de aportes (spec 001, T12).
-- aplicar_aporte: en una sola transacción comprueba que quien llama es editor, inserta o
-- corrige el registro (las restricciones de 0001 validan los valores), lo publica, deja en
-- el historial el editor y el aporte, y marca el aporte como Aprobado.
-- rechazar_aporte: exige motivo. Ambas se ejecutan con la sesión del editor (no anónimos).

-- Correos de editores siempre en minúsculas (la app compara con igualdad exacta).
update public.editores set correo = lower(correo) where correo <> lower(correo);
alter table public.editores add constraint correo_en_minusculas check (correo = lower(correo));

-- La propuesta original se conserva en `datos`; la versión aprobada (con ajustes) va aquí.
alter table public.aportes add column datos_aprobados jsonb;

create function public.aplicar_aporte(p_aporte_id bigint, p_datos jsonb) returns void
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

  -- Solo columnas reales y editables de la tabla destino.
  select string_agg(quote_ident(c.column_name), ', ') into v_columnas
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = v_tabla
    and p_datos ? c.column_name
    and c.column_name not in ('publicacion', 'creado_en', 'actualizado_en')
    and not (v_tabla in ('proyectos', 'noticias') and c.column_name = 'id');
  if v_columnas is null then
    raise exception 'El aporte no trae campos válidos para %', v_tabla;
  end if;

  -- El historial (disparador de 0001) toma el editor y el aporte de estos ajustes locales.
  perform set_config('app.editor', v_editor, true);
  perform set_config('app.aporte_id', p_aporte_id::text, true);

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

create function public.rechazar_aporte(p_aporte_id bigint, p_motivo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_editor() then
    raise exception 'Solo los editores pueden rechazar aportes' using errcode = '42501';
  end if;
  if coalesce(trim(p_motivo), '') = '' then
    raise exception 'El motivo es obligatorio para rechazar un aporte';
  end if;
  update public.aportes
  set publicacion = 'Rechazado', motivo = trim(p_motivo), revisado_en = now(),
      revisado_por = lower(coalesce(auth.jwt() ->> 'email', ''))
  where id = p_aporte_id and publicacion = 'Pendiente';
  if not found then
    raise exception 'El aporte % no existe o ya fue revisado', p_aporte_id;
  end if;
end;
$$;

-- Solo usuarios con sesión pueden llamarlas (y dentro se exige ser editor).
revoke execute on function public.aplicar_aporte(bigint, jsonb) from public, anon;
revoke execute on function public.rechazar_aporte(bigint, text) from public, anon;
grant execute on function public.aplicar_aporte(bigint, jsonb) to authenticated;
grant execute on function public.rechazar_aporte(bigint, text) to authenticated;

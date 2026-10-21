-- 0004 · Spec 002 (T03): 'Tipo uso/conexión' (en la interfaz «Servicios») es una lista cerrada,
-- con uno o varios valores separados por coma (RF-14, CA-14.1). La columna sigue siendo text;
-- el disparador de validación, regenerado abajo, revisa cada valor con el mismo mensaje que la
-- web, la importación y scripts/validar_datos.py.

-- ------------------------------------------------- conversión de los textos existentes
-- Mismos cambios que en datos/proyectos.csv (aprobados en la spec 002). Ninguna cifra cambia.
-- El historial registra la conversión con este editor.
select set_config('app.editor', 'migración 0004 (spec 002)', true);
update public.proyectos set tipo_uso_conexion = 'Inyección de energía en la noche'
  where tipo_uso_conexion = 'Inyección de energia por la noche';
update public.proyectos set tipo_uso_conexion = 'Mercado regulado a través de contratos de largo plazo'
  where tipo_uso_conexion = 'Mercado regulado a través de los contratos de largo plazo';

-- >>> validación generada desde datos/esquemas.json con scripts/generar_validacion_sql.py (no editar a mano)

create or replace function public.validar_proyectos() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.nombre is null or btrim(new.nombre::text) = '' then raise exception using errcode = '23514', message = '''Nombre'' es obligatorio'; end if;
  if new.estado is null or btrim(new.estado::text) = '' then raise exception using errcode = '23514', message = '''Estado'' es obligatorio'; end if;
  if new.estado is not null and new.estado not in ('En operación', 'En construcción', 'Anunciado', 'Inactivo') then raise exception using errcode = '23514', message = format('''Estado'' = ''%s'' no está entre los valores permitidos: En operación, En construcción, Anunciado, Inactivo', new.estado); end if;
  if new.tipo_uso_conexion is not null and exists (select 1 from regexp_split_to_table(new.tipo_uso_conexion, ',') as v where btrim(v) <> '' and btrim(v) not in ('Regulación primaria de frecuencia', 'Inyección de energía en la noche', 'Mercado regulado a través de contratos de largo plazo')) then raise exception using errcode = '23514', message = format('''Tipo uso/conexión'' = ''%s'' no está entre los valores permitidos: Regulación primaria de frecuencia, Inyección de energía en la noche, Mercado regulado a través de contratos de largo plazo', new.tipo_uso_conexion); end if;
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

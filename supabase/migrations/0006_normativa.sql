-- 0006 · Spec 004 (T01): los estudios académicos se guardan en normas con emisor 'Academia' y
-- tipo 'Estudio' (aclaración 1). Se reemplazan los check de 0001 y se regenera la validación.
alter table public.normas drop constraint if exists normas_emisor_check, add constraint normas_emisor_check check (emisor in ('CREG', 'MME', 'CNO', 'UPME', 'XM', 'Congreso', 'Academia'));
alter table public.normas drop constraint if exists normas_tipo_check, add constraint normas_tipo_check check (tipo in ('Ley', 'Decreto', 'Resolución', 'Proyecto de resolución', 'Acuerdo', 'Circular', 'Documento', 'Estudio'));
-- CA-04.3: si el documento no trae el día, se guarda el día 1 y se indica la precisión.
alter table public.normas add column precision_fecha text check (precision_fecha in ('Día', 'Mes', 'Año'));

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
  if new.precision_fecha is not null and new.precision_fecha not in ('Día', 'Mes', 'Año') then raise exception using errcode = '23514', message = format('''precision_fecha'' = ''%s'' no está entre los valores permitidos: Día, Mes, Año', new.precision_fecha); end if;
  if new.emisor is null or btrim(new.emisor::text) = '' then raise exception using errcode = '23514', message = '''emisor'' es obligatorio'; end if;
  if new.emisor is not null and new.emisor not in ('CREG', 'MME', 'CNO', 'UPME', 'XM', 'Congreso', 'Academia') then raise exception using errcode = '23514', message = format('''emisor'' = ''%s'' no está entre los valores permitidos: CREG, MME, CNO, UPME, XM, Congreso, Academia', new.emisor); end if;
  if new.tipo is null or btrim(new.tipo::text) = '' then raise exception using errcode = '23514', message = '''tipo'' es obligatorio'; end if;
  if new.tipo is not null and new.tipo not in ('Ley', 'Decreto', 'Resolución', 'Proyecto de resolución', 'Acuerdo', 'Circular', 'Documento', 'Estudio') then raise exception using errcode = '23514', message = format('''tipo'' = ''%s'' no está entre los valores permitidos: Ley, Decreto, Resolución, Proyecto de resolución, Acuerdo, Circular, Documento, Estudio', new.tipo); end if;
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

create or replace function public.validar_vehiculos_lineas() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.marca is null or btrim(new.marca::text) = '' then raise exception using errcode = '23514', message = '''Marca'' es obligatorio'; end if;
  if new.linea is null or btrim(new.linea::text) = '' then raise exception using errcode = '23514', message = '''Línea'' es obligatorio'; end if;
  if new.tipo_de_bateria is null or btrim(new.tipo_de_bateria::text) = '' then raise exception using errcode = '23514', message = '''Tipo de batería'' es obligatorio'; end if;
  if new.tipo_de_bateria is not null and new.tipo_de_bateria not in ('LFP', 'Lithium-ion', 'NMC Lithium-ion', 'ULTIUM') then raise exception using errcode = '23514', message = format('''Tipo de batería'' = ''%s'' no está entre los valores permitidos: LFP, Lithium-ion, NMC Lithium-ion, ULTIUM', new.tipo_de_bateria); end if;
  if new.capacidad_minima_kwh is null or btrim(new.capacidad_minima_kwh::text) = '' then raise exception using errcode = '23514', message = '''Capacidad mínima [kWh]'' es obligatorio'; end if;
  if new.capacidad_minima_kwh is not null and (new.capacidad_minima_kwh < 0) then raise exception using errcode = '23514', message = format('''Capacidad mínima [kWh]'' = %s fuera de rango [0, inf]', new.capacidad_minima_kwh); end if;
  if new.capacidad_maxima_kwh is null or btrim(new.capacidad_maxima_kwh::text) = '' then raise exception using errcode = '23514', message = '''Capacidad máxima [kWh]'' es obligatorio'; end if;
  if new.capacidad_maxima_kwh is not null and (new.capacidad_maxima_kwh < 0) then raise exception using errcode = '23514', message = format('''Capacidad máxima [kWh]'' = %s fuera de rango [0, inf]', new.capacidad_maxima_kwh); end if;
  if new.capacidad_maxima_kwh is not null and new.capacidad_minima_kwh is not null and new.capacidad_maxima_kwh < new.capacidad_minima_kwh then raise exception using errcode = '23514', message = format('''Capacidad máxima [kWh]'' = %s es menor que ''Capacidad mínima [kWh]''', new.capacidad_maxima_kwh); end if;
  if new.potencia_kw is not null and (new.potencia_kw < 0) then raise exception using errcode = '23514', message = format('''Potencia [kW]'' = %s fuera de rango [0, inf]', new.potencia_kw); end if;
  return new;
end;
$$;
drop trigger if exists validar_vehiculos_lineas on public.vehiculos_lineas;
create trigger validar_vehiculos_lineas before insert or update on public.vehiculos_lineas
  for each row execute function public.validar_vehiculos_lineas();

create or replace function public.validar_vehiculos_ventas() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.linea is null or btrim(new.linea::text) = '' then raise exception using errcode = '23514', message = '''Línea'' es obligatorio'; end if;
  if new.ano is null or btrim(new.ano::text) = '' then raise exception using errcode = '23514', message = '''Año'' es obligatorio'; end if;
  if new.ano is not null and new.ano <> trunc(new.ano) then raise exception using errcode = '23514', message = format('''Año'' = ''%s'' no es un número entero', new.ano); end if;
  if new.ano is not null and (new.ano < 2000 or new.ano > 2100) then raise exception using errcode = '23514', message = format('''Año'' = %s fuera de rango [2000, 2100]', new.ano); end if;
  if new.unidades is null or btrim(new.unidades::text) = '' then raise exception using errcode = '23514', message = '''Unidades'' es obligatorio'; end if;
  if new.unidades is not null and new.unidades <> trunc(new.unidades) then raise exception using errcode = '23514', message = format('''Unidades'' = ''%s'' no es un número entero', new.unidades); end if;
  if new.unidades is not null and (new.unidades < 0) then raise exception using errcode = '23514', message = format('''Unidades'' = %s fuera de rango [0, inf]', new.unidades); end if;
  return new;
end;
$$;
drop trigger if exists validar_vehiculos_ventas on public.vehiculos_ventas;
create trigger validar_vehiculos_ventas before insert or update on public.vehiculos_ventas
  for each row execute function public.validar_vehiculos_ventas();

-- <<< fin de la validación generada

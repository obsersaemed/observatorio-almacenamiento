# Vincula C:\dev\Observatorio con el proyecto Supabase de PRUEBAS y aplica las migraciones.
# El proyecto se toma de NEXT_PUBLIC_SUPABASE_URL en web\.env.local, así no se vincula
# producción por error. La contraseña de la base de datos la escribe el usuario.
# Si "db push" falla al conectar por el pooler ("failed to connect as temp role"), aplica el
# archivo de supabase/migrations en el SQL Editor del proyecto de pruebas y luego, cuando la
# CLI conecte, registra la migración con: npx supabase migration repair --status applied <versión>
$ErrorActionPreference = 'Stop'
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
Set-Location (Join-Path $PSScriptRoot '..')

$linea = Get-Content 'web\.env.local' | Where-Object { $_ -match '^NEXT_PUBLIC_SUPABASE_URL=https://([a-z0-9]{20})\.supabase\.co$' } | Select-Object -First 1
if (-not $linea) { throw 'NEXT_PUBLIC_SUPABASE_URL no tiene la forma https://<ref>.supabase.co en web\.env.local' }
$ref = $Matches[1]
Write-Host "Proyecto de pruebas: $($ref.Substring(0,4))... (tomado de web\.env.local)" -ForegroundColor Cyan

Write-Host "`n1/3 Iniciar sesion en Supabase (se abre el navegador)" -ForegroundColor Cyan
npx --yes supabase@2.121.0 login
if ($LASTEXITCODE -ne 0) { throw 'supabase login fallo' }

Write-Host "`n2/3 Vincular la carpeta. Escribe la contrasena de la BASE DE DATOS del proyecto de pruebas" -ForegroundColor Cyan
npx --yes supabase@2.121.0 link --project-ref $ref
if ($LASTEXITCODE -ne 0) { throw 'supabase link fallo' }

Write-Host "`n3/3 Migraciones que se aplicaran (simulacion):" -ForegroundColor Cyan
npx --yes supabase@2.121.0 db push --dry-run
if ($LASTEXITCODE -ne 0) { throw 'la simulacion de db push fallo' }
Write-Host "`nAplicando (confirma con Y):" -ForegroundColor Cyan
npx --yes supabase@2.121.0 db push
if ($LASTEXITCODE -ne 0) { throw 'db push fallo' }
Write-Host "`nListo. Vuelve a la conversacion y escribe 'listo'." -ForegroundColor Green

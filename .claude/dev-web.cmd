@echo off
rem Arranca el servidor de desarrollo de web/ asegurando que Node este en el PATH
rem (la app de escritorio puede tener un PATH anterior a la instalacion de Node).
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0..\web"
npm run dev

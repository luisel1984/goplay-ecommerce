@echo off
title Instalar Node.js 20 LTS
color 0A
echo ============================================
echo  Instalando Node.js 20 LTS (requerido)
echo ============================================
echo.

echo Intentando instalar con winget...
winget install OpenJS.NodeJS.LTS --version 20.18.0 --accept-source-agreements --accept-package-agreements
if %errorlevel% equ 0 (
    echo.
    echo ============================================
    echo  Node.js instalado correctamente!
    echo  IMPORTANTE: Cierra esta ventana y vuelve
    echo  a ejecutar PASO2_Backend.bat
    echo ============================================
    pause
    exit /b 0
)

echo.
echo winget no disponible. Abriendo descarga manual...
start https://nodejs.org/dist/v20.18.0/node-v20.18.0-x64.msi
echo.
echo ============================================
echo  Se abrio el navegador para descargar Node.js
echo  1. Descarga el archivo .msi
echo  2. Ejecutalo y sigue el instalador (Next, Next, Finish)
echo  3. REINICIA esta ventana de comandos
echo  4. Ejecuta PASO2_Backend.bat de nuevo
echo ============================================
pause

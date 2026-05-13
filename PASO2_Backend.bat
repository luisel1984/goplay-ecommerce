@echo off
title GoPlay - PASO 2: Backend API
color 0B
echo ============================================
echo  GoPlayCommerce - Backend (Puerto 4000)
echo ============================================
echo.
cd /d C:\Users\User\goplay-ecommerce\backend

echo [1/6] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js no instalado. Descarga desde https://nodejs.org
    pause
    exit /b 1
)
echo OK - Node.js detectado
echo.
pause

echo [2/6] Copiando variables de entorno...
if not exist .env (
    copy .env.example .env
    echo Archivo .env creado
) else (
    echo Archivo .env ya existe, conservando configuracion
)
echo.
pause

echo [3/6] Instalando dependencias npm (puede tardar 3-5 minutos)...
npm install
if %errorlevel% neq 0 (
    echo ERROR en npm install
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.
pause

echo [4/6] Generando cliente Prisma...
npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR en prisma generate
    pause
    exit /b 1
)
echo OK - Cliente Prisma generado
echo.
pause

echo [5/6] Ejecutando migraciones (crea tablas en PostgreSQL)...
echo IMPORTANTE: Si pregunta algo, escribe "y" y presiona Enter
npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo ERROR en prisma migrate
    echo Asegurate de que el PASO1 Docker este corriendo (docker ps)
    pause
    exit /b 1
)
echo OK - Base de datos lista
echo.
pause

echo [6/6] Cargando datos de prueba...
npm run seed
if %errorlevel% neq 0 (
    echo ERROR en seed (datos de prueba)
    echo Puede que los datos ya existan - continuando...
)
echo.
pause

echo ============================================
echo  Arrancando servidor en http://localhost:4000
echo  NO CIERRES ESTA VENTANA
echo ============================================
echo.
npm run dev
echo.
echo El servidor se detuvo. Presiona cualquier tecla para cerrar.
pause

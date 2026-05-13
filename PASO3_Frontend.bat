@echo off
title GoPlay - PASO 3: Frontend Tienda
color 0E
echo ============================================
echo  GoPlayCommerce - Frontend (Puerto 3000)
echo ============================================
echo.
cd /d C:\Users\User\goplay-ecommerce\frontend

echo Verificando que el backend este corriendo (puerto 4000)...
curl -s http://localhost:4000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ADVERTENCIA: El backend no responde en puerto 4000.
    echo Asegurate de que PASO2_Backend.bat este corriendo.
    echo Continua de todas formas en 5 segundos...
    timeout /t 5 /nobreak
)

echo.
echo Copiando variables de entorno...
if not exist .env.local (
    copy .env.example .env.local
    echo Archivo .env.local creado
) else (
    echo Archivo .env.local ya existe
)

echo.
echo Instalando dependencias npm...
npm install

echo.
echo ============================================
echo  Arrancando tienda en http://localhost:3000
echo ============================================
echo.
echo  ACCESOS DIRECTOS:
echo  Tienda:    http://localhost:3000/fr
echo  Catalogo:  http://localhost:3000/fr/produits
echo  Admin:     http://localhost:3000/fr/admin
echo  Emails:    http://localhost:8025
echo.
echo  Admin:    admin@goplayelectronic.fr / admin123
echo  Cliente:  sophie.martin@example.com / user123
echo ============================================
echo.
npm run dev

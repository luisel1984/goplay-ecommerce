@echo off
title GoPlay - PASO 1: Docker
color 0A
echo ============================================
echo  GoPlayCommerce - Arrancando Docker
echo ============================================
echo.
echo Verificando Docker...
docker --version
if %errorlevel% neq 0 (
    echo ERROR: Docker no esta instalado o no esta corriendo.
    echo Abre Docker Desktop primero y espera que inicie.
    pause
    exit /b 1
)
echo.
echo Arrancando PostgreSQL, Redis y MailHog...
cd /d C:\Users\User\goplay-ecommerce
docker-compose up -d
echo.
echo Esperando 5 segundos para que los contenedores arranquen...
timeout /t 5 /nobreak
echo.
echo Verificando contenedores activos:
docker ps
echo.
echo ============================================
echo  PASO 1 COMPLETADO
echo  Ahora ejecuta PASO2_Backend.bat
echo ============================================
pause

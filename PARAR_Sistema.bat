@echo off
title GoPlay - Detener Sistema
color 0C
echo ============================================
echo  GoPlayCommerce - Deteniendo todo
echo ============================================
echo.
echo Deteniendo contenedores Docker (datos conservados)...
cd /d C:\Users\User\goplay-ecommerce
docker-compose down
echo.
echo Sistema detenido. Los datos de PostgreSQL se conservan.
echo Para volver a arrancar: ejecuta PASO1, PASO2 y PASO3 de nuevo.
echo.
pause

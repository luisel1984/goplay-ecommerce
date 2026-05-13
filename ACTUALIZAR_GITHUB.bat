@echo off
title GoPlay - Forzar actualizacion GitHub
color 0D
echo ============================================
echo  Subiendo correcciones a GitHub
echo ============================================
echo.
cd /d C:\Users\User\goplay-ecommerce

echo Estado actual de cambios:
git status
echo.

echo Agregando todos los archivos modificados...
git add -A
echo.

echo Commit del fix...
git commit -m "fix: tsconfig exclude prisma seed from tsc build" --allow-empty
echo.

echo Subiendo a GitHub...
git push origin main
echo.

if %errorlevel% equ 0 (
    echo ============================================
    echo  SUBIDO CORRECTAMENTE
    echo  Railway redesplegara en 1-2 minutos
    echo ============================================
) else (
    echo ERROR - verifica tu conexion
)
pause

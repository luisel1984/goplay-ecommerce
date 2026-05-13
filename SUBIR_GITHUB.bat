@echo off
title GoPlay - Subir a GitHub
color 0D
echo ============================================
echo  GoPlayCommerce - Subir codigo a GitHub
echo ============================================
echo.

cd /d C:\Users\User\goplay-ecommerce

echo [1/6] Configurando identidad git...
git config --global user.email "luisel1984@proton.me"
git config --global user.name "luisel1984"
echo OK
echo.

echo [2/6] Inicializando repositorio...
git init
git branch -M main
echo OK
echo.

echo [3/6] Agregando todos los archivos...
git add .
echo Archivos agregados:
git status --short
echo.

echo [4/6] Creando commit inicial...
git commit -m "GoPlayCommerce v1.0 - E-commerce electronica FR"
if %errorlevel% neq 0 (
    echo ERROR: No se pudo crear el commit.
    pause
    exit /b 1
)
echo OK - Commit creado
echo.

echo [5/6] Conectando con GitHub...
git remote remove origin 2>nul
git remote add origin https://github.com/luisel1984/goplay-ecommerce.git
echo OK
echo.

echo [6/6] Subiendo codigo a GitHub...
echo.
echo IMPORTANTE: Cuando pida contrasena, pega tu token de GitHub
echo (el que empieza con ghp_...)
echo.
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo ERROR al subir. Verifica que el token tenga permisos "repo"
    pause
    exit /b 1
)

echo.
echo ============================================
echo  CODIGO SUBIDO EXITOSAMENTE A GITHUB
echo  https://github.com/luisel1984/goplay-ecommerce
echo  Ahora ve a Railway para el PASO 3
echo ============================================
pause

@echo off
title GoPlay - Fix completo
color 0A
cd /d C:\Users\User\goplay-ecommerce

echo Subiendo todos los fixes...
git add backend/Dockerfile
git add backend/src/routes/product.routes.ts
git add backend/src/services/stripe.service.ts
git add backend/tsconfig.json
git add backend/tsconfig.build.json
git add backend/package.json

git status
git commit -m "fix: product.routes map callback, stripe apiVersion, standalone tsconfig"
git push origin main

echo.
if %errorlevel% equ 0 (
    echo SUBIDO EXITOSAMENTE - Revisa Railway en 3 min
) else (
    echo ERROR al subir
)
pause

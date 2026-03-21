@echo off
title PUENTE DE IMPRESION - THE BEAR
setlocal enabledelayedexpansion

echo ===================================================
echo   AGENTE DE IMPRESION LOCAL (MODO NUBE)
echo ===================================================
echo.

:: 1. Intentar configurar la red (Necesita Administrador)
echo [+] Configurando IP local para la impresora (192.168.123.10)...
netsh interface ip add address "Wi-Fi" 192.168.123.10 255.255.255.0 >nul 2>&1
netsh interface ip add address "Ethernet" 192.168.123.10 255.255.255.0 >nul 2>&1

:: 2. Verificar si node está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Error: Node.js no esta instalado.
    pause
    exit /b
)

:: 3. Iniciar el puente
echo [+] Iniciando conexion con Supabase...
echo [!] Manten esta ventana abierta para recibir pedidos de Vercel.
echo.

node --env-file=.env.local bridge-impresora.js

echo.
echo [!] El proceso se ha detenido.
pause

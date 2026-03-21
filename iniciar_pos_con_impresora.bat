@echo off
:: SCRIPT DE INICIO RÁPIDO - THE BEAR POS
:: Ejecútame como ADMINISTRADOR para configurar la impresora
:: --------------------------------------------------------

:: 1. Intentar configurar el puente de red para la cocina (IP de la impresora)
:: Cambia "Wi-Fi" por "Ethernet" si usas cable en tu PC
echo [+] Configurando puente de red para la impresora en la cocina (192.168.123.10)...
netsh interface ip add address "Wi-Fi" 192.168.123.10 255.255.255.0 >nul 2>&1
netsh interface ip add address "Ethernet" 192.168.123.10 255.255.255.0 >nul 2>&1

:: 2. Iniciar el servidor de POS
echo [+] Iniciando el sistema POS...
echo [!] Puedes acceder desde el celular a: http://192.168.0.10:3000
npm run dev

pause

#!/bin/bash
# SCRIPT DE INICIO RÁPIDO - THE BEAR POS (LINUX)
# ----------------------------------------------

# 1. Configurar puente de red para la cocina (IP de la impresora)
# Cambia 'enp3s0' por el nombre de tu red (puedes verlo con 'ip link')
echo "[+] Configurando puente de red para la impresora en la cocina (192.168.123.10)..."
sudo ip addr add 192.168.123.10/24 dev enp3s0 2>/dev/null || echo "[!] La interfaz enp3s0 no existe, intenta con 'eth0' o 'wlan0'."

# 2. Iniciar el servidor de POS
echo "[+] Iniciando el sistema POS..."
npm run start

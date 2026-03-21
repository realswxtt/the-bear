#!/bin/bash
# SCRIPT DE INICIO PUENTE DE IMPRESIÓN (LINUX)
# ----------------------------------------------

echo "==================================================="
echo "   AGENTE DE IMPRESIÓN LOCAL (MODO NUBE) - LINUX"
echo "==================================================="
echo ""

# 1. Configurar la red (Necesita sudo)
echo "[+] Configurando IP local para la impresora (192.168.123.10)..."
# Intentamos primero con enp1s0 que es la detectada en tu PC
sudo ip addr add 192.168.123.10/24 dev enp1s0 2>/dev/null || \
sudo ip addr add 192.168.123.10/24 dev enp3s0 2>/dev/null || \
sudo ip addr add 192.168.123.10/24 dev eth0 2>/dev/null || \
sudo ip addr add 192.168.123.10/24 dev wlan0 2>/dev/null

# 2. Iniciar el puente con las variables de entorno nativas
echo "[+] Iniciando conexión con Supabase..."
echo "[!] Mantén esta ventana abierta para recibir pedidos de Vercel."
echo ""

node --env-file=.env.local bridge-impresora.js

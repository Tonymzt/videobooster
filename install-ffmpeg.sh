#!/bin/bash

# install-ffmpeg.sh - Script para instalar FFmpeg en macOS

echo "🎬 INSTALADOR DE FFMPEG PARA VIDEOBOOSTER"
echo "=========================================="
echo ""

# Verificar si FFmpeg ya está instalado
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg ya está instalado:"
    ffmpeg -version | head -n 1
    exit 0
fi

echo "❌ FFmpeg no está instalado"
echo ""
echo "Opciones de instalación:"
echo ""
echo "1. Homebrew (recomendado)"
echo "2. MacPorts"
echo "3. Descargar binario manualmente"
echo ""

# Verificar si Homebrew está instalado
if command -v brew &> /dev/null; then
    echo "✅ Homebrew detectado"
    echo ""
    read -p "¿Instalar FFmpeg con Homebrew? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo "📦 Instalando FFmpeg..."
        brew install ffmpeg
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ FFmpeg instalado exitosamente"
            ffmpeg -version | head -n 1
        else
            echo "❌ Error en la instalación"
            exit 1
        fi
    fi
else
    echo "❌ Homebrew no está instalado"
    echo ""
    echo "Para instalar Homebrew, ejecuta:"
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "Luego ejecuta este script nuevamente"
    exit 1
fi

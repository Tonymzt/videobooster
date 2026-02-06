#!/bin/bash

# 🧪 TEST 4: RATE LIMITING - VIDEOBOOSTER
# Límite configurado: 20 peticiones por minuto (incrementado para evitar falsos positivos en carga)

API_URL="http://localhost:3001/api/settings/fiscal"

# Tony: Obtener este token del Session Storage en tu navegador
TOKEN="TU_ACCESS_TOKEN_AQUI"

echo "🧪 Iniciando prueba de Rate Limiting..."
echo "Enviando 25 peticiones rápidas..."

for i in {1..25}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" $API_URL)
  STATUS=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$STATUS" == "200" ]; then
    echo "Petición $i: ✅ 200 OK"
  elif [ "$STATUS" == "429" ]; then
    echo "Petición $i: 🛡️ 429 Too Many Requests (Límite alcanzado)"
  else
    echo "Petición $i: ❌ Error $STATUS"
    echo "$RESPONSE"
  fi
  
  # Pequeño delay para no saturar el socket del OS, pero suficiente para disparar el rate limit de la app
  sleep 0.1
done

echo "-----------------------------------"
echo "Prueba finalizada. Si viste STATUS 429, la protección es EXITOSA."

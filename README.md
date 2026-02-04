# 📦 VideoBooster MVP - Generador de Videos Virales

Sistema completo para convertir productos de e-commerce en videos virales para TikTok/Reels usando IA.

---

## 🎯 Módulos Implementados

### ✅ Módulo #001: Scraper
Extractor de datos de productos desde **MercadoLibre** y **Amazon México** usando Puppeteer con capacidades anti-bloqueo.

**Estado:** APROBADO ✅  
**Documentación:** Ver sección "Módulo Scraper" abajo

### ✅ Módulo #002: Generador de Guiones IA
Generador de guiones de video usando **OpenAI GPT-4o**, convirtiendo datos de productos en scripts virales para TikTok/Reels.

**Estado:** COMPLETADO ✅  
**Documentación:** Ver sección "Módulo Generador de Guiones" abajo

---

## 🚀 Instalación

```bash
npm install
```

### Configuración de Entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` y agrega tu API key de OpenAI:
```bash
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o
MAX_TOKENS=1000
TEMPERATURE=0.7
```

---

## 📦 MÓDULO #001: SCRAPER

### Uso

#### Ejecución Standalone
```bash
node src/scraper.js
```

#### Uso desde Otro Módulo
```javascript
const { scrapeProduct } = require('./src/scraper');

const result = await scrapeProduct('https://www.mercadolibre.com.mx/...');
console.log(result);
```

### Formato de Salida

```json
{
  "platform": "mercadolibre",
  "title": "Apple iPad air 11 (wi-fi, 128 gb) - Blanco",
  "price": 15423,
  "description": "La pantalla Liquid Retina integra tecnologías...",
  "images": [
    "https://http2.mlstatic.com/D_Q_NP_960276-MLA95681783185_102025-R.webp"
  ],
  "scrapedAt": "2026-02-03T00:51:35.365Z",
  "success": true
}
```

### Características
- ✅ User-Agent rotativo (5 variantes)
- ✅ Viewport aleatorio (móvil/desktop)
- ✅ Stealth plugin anti-detección
- ✅ Retry automático (1 intento)
- ✅ Timeout de 30 segundos

---

## 🤖 MÓDULO #002: GENERADOR DE GUIONES IA

### Uso

#### Script de Prueba
```bash
node test/test-script.js
```

#### Uso desde Código
```javascript
const { generateVideoScript } = require('./src/scriptGenerator');

const productData = {
  title: "Freidora de Aire Oster",
  price: 945,
  description: "Recubrimiento DiamondForce..."
};

const result = await generateVideoScript(productData);

if (result.success) {
  console.log('Escenas:', result.script.scenes.length);
  console.log('Tokens:', result.tokensUsed);
}
```

### Formato de Salida

```json
{
  "success": true,
  "script": {
    "scenes": [
      {
        "visual_cue": "Plano cerrado de una freidora de aire vieja y sucia",
        "text": "¿Cansado de limpiar tu freidora de aire cada vez que la usas?",
        "duration_est": 3
      },
      {
        "visual_cue": "Transición rápida a la Oster® Freidora de Aire Manual",
        "text": "¡Conoce la Oster® Freidora con recubrimiento DiamondForce!",
        "duration_est": 4
      }
    ]
  },
  "generatedAt": "2026-02-03T01:16:35.542Z",
  "model": "gpt-4o-2024-08-06",
  "tokensUsed": 861
}
```

### Características del Prompt

- 🎯 **Tono:** Español latino (México), dinámico y urgente
- 📐 **Framework:** PROBLEMA → SOLUCIÓN → OFERTA → CTA
- ⏱️ **Duración:** 30-45 segundos (máx 8 escenas)
- 🎬 **Gancho:** Primeros 3 segundos impactantes
- 💰 **Precio:** Solo se menciona si es ventajoso (<$500 MXN)

### Validaciones Implementadas

- ✅ Verificación de OPENAI_API_KEY
- ✅ Campos obligatorios (title, price, description)
- ✅ Tipos de datos correctos
- ✅ Sanitización de descripción (máx 500 caracteres)
- ✅ Timeout de 45 segundos
- ✅ JSON parseable
- ✅ Mínimo 3 escenas, máximo 10

### Manejo de Errores

```javascript
// Errores específicos manejados:
- API_QUOTA_EXCEEDED: Cuota de API excedida
- INVALID_API_KEY: API key inválida
- API_TIMEOUT: Timeout de 45s excedido
- OPENAI_ERROR: Error genérico con mensaje
```

---

## 🧪 Pruebas

### Scraper
```bash
# Pruebas funcionales
node src/scraper.js

# Pruebas de errores
node src/test-error-handling.js

# Depuración de imágenes
node src/debug-images.js
```

### Generador de Guiones
```bash
# Prueba con producto real
node test/test-script.js

# Pruebas de manejo de errores
node test/test-script-errors.js
```

---

## 📁 Estructura del Proyecto

```
videobooster/
├── .env.example           # Template de variables
├── .env                   # Configuración (NO commitear)
├── .gitignore            # Archivos excluidos
├── package.json
├── README.md
├── src/
│   ├── scraper.js        # ✅ Módulo scraper
│   ├── selectors.js      # Selectores CSS
│   ├── utils.js          # Funciones auxiliares
│   ├── scriptGenerator.js # ✅ Generador de guiones
│   ├── prompts/
│   │   └── videoScript.js # Prompt engineering
│   ├── test-error-handling.js
│   └── debug-images.js
└── test/
    ├── test-urls.json    # URLs de prueba
    ├── test-script.js    # Prueba de guiones
    └── test-script-errors.js # Pruebas de errores
```

---

## 🔐 Seguridad

### ❌ NO HACER:
- Hardcodear API keys en el código
- Commitear el archivo `.env`
- Usar `gpt-3.5-turbo` (debe ser `gpt-4o`)
- Generar más de 10 escenas por guion

### ✅ HACER:
- Usar variables de entorno
- Mantener `.env` en `.gitignore`
- Validar inputs antes de enviar a OpenAI
- Monitorear tokens usados

---

## 📊 Resultados de Pruebas

### Módulo Scraper
- ✅ MercadoLibre: ÉXITO (13.14s, 3 imágenes)
- ✅ Amazon: ÉXITO (12.69s, 1 imagen)
- ✅ Manejo de errores: 4/4 pruebas pasadas

### Módulo Generador de Guiones
- ✅ Generación exitosa: 8 escenas, 31s duración
- ✅ Tokens usados: 861
- ✅ Modelo: gpt-4o-2024-08-06
- ✅ Manejo de errores: 5/5 pruebas pasadas

---

## 🔄 Próximos Módulos

- [ ] Módulo #003: Generador de voz (Text-to-Speech)
- [ ] Módulo #004: Compositor de video (FFmpeg + overlays)
- [ ] Módulo #005: Sistema de colas (Bull + Redis)

---

## 📝 Ejemplo Completo

```javascript
// 1. Scrapear producto
const { scrapeProduct } = require('./src/scraper');
const productData = await scrapeProduct('https://www.amazon.com.mx/dp/B0DKXXWXN4');

// 2. Generar guion
const { generateVideoScript } = require('./src/scriptGenerator');
const scriptResult = await generateVideoScript(productData);

if (scriptResult.success) {
  console.log(`✅ Guion generado: ${scriptResult.script.scenes.length} escenas`);
  console.log(`📊 Tokens: ${scriptResult.tokensUsed}`);
  
  // 3. Siguiente: Generar voz y video...
}
```

---

**Versión**: 2.0.0  
**Última actualización**: 2026-02-02  
**Autor**: Antigravity (CTO)  
**Auditor**: Claude

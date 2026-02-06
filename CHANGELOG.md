# Changelog - VideoBooster

## [v2.0.1] - 6 Febrero 2026

### Removed
- 🗑️ **Eliminado completamente sistema de scraping**
  - Archivos eliminados: `src/scraper.js`, `src/selectors.js`
  - Dependencias eliminadas: puppeteer, cheerio
  - Endpoints eliminados: `/api/scrape`
  - Razón: Pivote a arquitectura de upload directo
  
### Cleaned
- 🧹 **Código limpio sin warnings de deprecated**
  - Cero rastros de scraper en logs
  - Cero imports obsoletos
  - Cero comentarios de código muerto

## [Unreleased] - Enero 2026

### 🎯 PIVOTE ARQUITECTÓNICO MAYOR

#### Eliminado
- ❌ **Sistema de Scraping de Marketplaces**
  - Scraping de Amazon México (deprecated)
  - Scraping de MercadoLibre México (deprecated)
  - Dependencias: Puppeteer, Cheerio (deprecated)
  - Endpoint `/api/scrape` (nunca implementado en routes.js)

- ❌ **Integración con Vertex AI**
  - Google Cloud Vertex abandonado
  - Razón: Restricciones legales y marcas de agua forzadas

#### Agregado
- ✅ **Sistema de Upload Directo de Imágenes**
  - Drag & Drop en frontend
  - Validación client-side y server-side
  - Preview instantáneo con base64
  - Endpoint `/api/upload-images`
  - Soporte para hasta 3 imágenes (PNG/JPG/WEBP)
  - Máximo 10MB por imagen

- ✅ **Arquitectura Soberana**
  - Stack: Leonardo.ai + ElevenLabs + OpenAI
  - API Keys SOLO en backend (seguridad mejorada)
  - Frontend sin claves sensibles

#### Modificado
- 🔧 **DockPrompt Component**
  - De: Tabs (Manual + Scraping)
  - A: Upload Zone + Descripción manual

- 🔧 **Frontend .env.local**
  - Eliminadas: LEONARDO_API_KEY, ELEVENLABS_API_KEY
  - Mantenidas: Solo variables públicas (NEXT_PUBLIC_*)

- 🔧 **EditorPage**
  - Agregado: Envío de referenceImages al backend
  - Estado: referenceImages ahora viene de uploads

#### Seguridad
- 🔒 API keys sensibles SOLO en backend
- 🔒 Frontend solo llama a endpoints del backend
- 🔒 Validación doble (client + server)

---

## [v1.0.0] - Diciembre 2025

### Implementado
- ✅ Sistema de scraping (deprecated en v1.1)
- ✅ Integración con Leonardo.ai
- ✅ Integración con ElevenLabs
- ✅ Dashboard con Supabase Auth
- ✅ Dock UI con Framer Motion
- ✅ Cloudflare R2 para storage

---

**Notas:**
- Los archivos deprecated se mantendrán hasta v2.0
- Para más información: Ver documentación en `/docs`

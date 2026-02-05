# VideoBooster MVP - Arquitectura Soberana

## 🎯 Stack Tecnológico

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Framer Motion
- Supabase Auth

### Backend
- Node.js 18+
- Express.js
- BullMQ + Redis (cola de trabajos)
- Supabase PostgreSQL

### Servicios IA (Stack Soberano)
- **Leonardo.ai** - Generación de video/imagen
- **ElevenLabs** - Text-to-Speech
- **OpenAI GPT-4** - Generación de scripts
- **Cloudflare R2** - Storage de assets

## 🚀 Inicio Rápido

### 1. Clonar repositorio
```bash
git clone [repo]
cd videobooster-mvp
```

### 2. Instalar dependencias

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 3. Configurar variables de entorno

**Backend (`.env`):**
```bash
# APIs de IA
OPENAI_API_KEY=sk-proj-...
LEONARDO_API_KEY=...
ELEVENLABS_API_KEY=sk_...
HEYGEN_API_KEY=sk_V2_hg... (opcional)
REMOVE_BG_API_KEY=...

# Base de datos
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=https://...

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend (`.env.local`):**
```bash
# Solo variables públicas
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_R2_PUBLIC_URL=https://...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

### 4. Iniciar servicios

**Terminal 1 - Backend:**
```bash
npm run dev
# Escucha en http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Escucha en http://localhost:3001
```

**Terminal 3 - Redis (opcional local):**
```bash
redis-server
```

## 📋 Endpoints Principales

### Frontend API Routes
- `POST /api/upload-images` - Subir imágenes de referencia
- `POST /api/generate-video` - Generar video con IA

### Backend API
- `POST /api/generate-video` - Procesar generación (llama a Leonardo/ElevenLabs)
- `GET /api/video-status/:jobId` - Estado de trabajo
- `GET /api/stats` - Estadísticas del sistema
- `GET /api/health` - Health check

## 🏗️ Arquitectura
```
Usuario
  ↓
Frontend (Next.js) → Upload de imágenes + Prompt
  ↓
Backend API (Express)
  ↓
BullMQ Queue → Worker Pipeline
  ↓
┌────────────────────────────────┐
│ Leonardo.ai  (Video/Imagen)    │
│ ElevenLabs   (Voz)             │
│ OpenAI       (Scripts)         │
└────────────────────────────────┘
  ↓
Cloudflare R2 (Storage)
  ↓
Usuario recibe video final
```

## 📝 Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para historial completo de cambios.

### Últimos cambios importantes
- ❌ Eliminado sistema de scraping de marketplaces
- ✅ Implementado sistema de upload directo
- 🔒 Mejorada seguridad (API keys solo en backend)

## 🚧 Deprecaciones

Los siguientes módulos están deprecated y serán eliminados en v2.0:
- `src/scraper.js`
- `src/selectors.js`
- Endpoint `/api/scrape` (nunca implementado)
- Dependencias: puppeteer, cheerio

## 📚 Documentación

- [Arquitectura](./docs/ARCHITECTURE.md) (TODO)
- [API Reference](./docs/API.md) (TODO)
- [Deployment](./docs/DEPLOYMENT.md) (TODO)

## 🤝 Contribuir

Este es un proyecto privado. Contactar a Tony Plascencia para más información.

## 📄 Licencia

Propietario - VideoBooster 2026

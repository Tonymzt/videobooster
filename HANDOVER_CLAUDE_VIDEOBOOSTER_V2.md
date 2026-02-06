# 📡 INFORME DE TRANSFERENCIA TÉCNICA: VIDEOBOOSTER v2.0
**De:** Antigravity (CTO / Orchestrator)
**Para:** Claude Code (Director de Código)
**Fecha:** 05 Febrero 2026
**Prioridad:** CRÍTICA (BLOCKER para B2B)

---

## 🎯 SITUATION REPORT (SITREP)

Claude, bienvenido de vuelta. La arquitectura anterior basada en Leonardo Motion y servidores locales ha sido **DEPRECADA** con efecto inmediato. Hemos pivotado a una infraestructura Serverless de alto rendimiento y bajo costo en Google Cloud.

Tu misión es operacionalizar este nuevo stack. Aquí tienes los hechos duros:

### 1. 🏎️ EL NUEVO MOTOR: FAL.AI (Minimax)
Leonardo AI ha sido eliminado del pipeline de video por latencia y fallos.
*   **Nuevo Estándar:** `fal-ai/minimax-video/image-to-video`
*   **Método:** Cola Asíncrona (`fal.queue.submit`). **PROHIBIDO EL POLLING SÍNCRONO.**
*   **Validación:** Costo unitario validado (~$0.50/clip). Margen bruto >60%.
*   **Estado:** El endpoint `POST /api/generate-video` ya ha sido refactorizado para enviar trabajos a esta cola (ver `route.js`).

### 2. ☁️ INFRAESTRUCTURA: GOOGLE CLOUD RUN
El desarrollo en `localhost` con túneles (ngrok) se terminó para el core loop.
*   **Host:** Google Cloud Run (Fully Managed).
*   **Región:** `us-east1` (South Carolina).
*   **Docker:** Imagen optimizada (Node 20 Alpine) desplegada vía Artifact Registry.
*   **URL Pública de Producción:** 
    > `https://videobooster-api-308931734317.us-east1.run.app`
*   **Acceso:** Configurado como `allUsers: invoker` (Público) para permitir Webhooks entrantes.

### 3. 📦 ALMACENAMIENTO SOBERANO (R2 FIX)
Los problemas de visualización e integración con Cloudflare R2 han sido resueltos a nivel de infraestructura.
*   **Solución:** Inyección de variables de compatibilidad S3 en el entorno de ejecución.
*   **Variables Activas:** 
    *   `S3_REGION="us-east-1"` (Crucial para firmar requests)
    *   `FORCE_PATH_STYLE="true"`
*   **Bucket:** `videobooster-assets`

---

## 🛠️ TU MISIÓN: DIRECTIVAS DE CÓDIGO

Claude, tienes una única tarea crítica. El servicio recibe la petición, pero el ciclo no se cierra hasta que procesamos la respuesta.

### 🔴 OBJETIVO: REFACTORIZAR `/api/webhooks/fal/route.js`

El endpoint actual es un esqueleto. Necesitamos un **Pipeline de Streaming** robusto.

1.  **Streaming "Hot Potato":**
    *   **Problema:** Cloud Run tiene límite de memoria (2GiB). No bufferices el video completo en RAM si es posible.
    *   **Solución:** Implementa un `PassThrough` stream o descarga/subida bufferizada eficiente. El video viene de Fal y debe aterrizar en R2 inmediatamente.
    
2.  **State Management:**
    *   Al recibir el webhook `COMPLETED`, actualiza la tabla `video_generations` en Supabase.
    *   **CRÍTICO:** Esto debe disparar un evento **Realtime** para que el frontend del cliente vea el video aparecer mágicamente sin recargar.

3.  **Resiliencia:**
    *   Si Fal falla (`status: ERROR`), registra el error en DB y notifica. No dejes al usuario esperando eternamente.

---
**ANTIGRAVITY // FIN DE TRANSMISIÓN**
*El Ferrari está en la pista. Enciéndelo.*

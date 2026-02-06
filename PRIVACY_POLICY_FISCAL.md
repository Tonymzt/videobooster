# Política de Protección de Datos Fiscales - VideoBooster

VideoBooster se compromete a proteger la privacidad y seguridad de sus datos fiscales de acuerdo con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).

## 1. Medidas de Seguridad Técnicas
Implementamos un sistema de **Defensa en Profundidad** con 6 capas de seguridad:

### A. Encriptación de Grado Bancario (AES-256)
Sus datos sensibles (RFC, Razón Social y Dirección) no se guardan como texto simple. Son encriptados usando funciones criptográficas de Postgres (`pgcrypto`) antes de tocar el disco.

### B. Aislamiento de Acceso (RLS)
Utilizamos **Row Level Security** (Seguridad a Nivel de Fila). Esto garantiza que, a nivel de base de datos, un usuario jamás pueda consultar los registros de otro, incluso si hubiera una falla en la aplicación principal.

### C. Túneles API Seguros
El acceso a sus datos fiscales no es directo. Pasa por un servidor intermedio (API Route) que implementa:
- **Rate Limiting:** Previene ataques de fuerza bruta.
- **Validación JWT:** Verificación criptográfica de su identidad.
- **Logging de Auditoría:** Registramos cada vez que se accede o actualiza su información fiscal para detectar anomalías.

## 2. Uso Firme de los Datos
Sus datos fiscales se recopilan **únicamente** para:
- La correcta emisión de facturas CFDI 4.0.
- Cumplimiento con las normativas vigentes del SAT.

## 3. Sus Derechos (ARCO)
Usted tiene derecho a **Acceder, Rectificar, Cancelar u Oponerse** al uso de sus datos. Puede hacerlo directamente desde su panel de configuración o contactando a nuestro Oficial de Privacidad.

---
**Estatus de Seguridad:** 🔒 PROTEGIDO
**Fecha de Implementación:** Febrero 2026

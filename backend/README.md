<div align="center">

# ⚙️ LectoApp — Backend Core API
### Servicio RESTful, Motor Pedagógico y Generación Asistida con IA

[![Vitest](https://img.shields.io/badge/Tests-233%20Passed-brightgreen?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-75.5%25%20Threshold-success?style=flat-square)](https://vitest.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Express](https://img.shields.io/badge/Express-4.21-black?style=flat-square&logo=express)](https://expressjs.com/)

</div>

---

## 🏛 Arquitectura en Capas

El backend de **LectoApp** implementa una arquitectura en capas estrictamente tipada con TypeScript y orientada al dominio pedagógico. Se rige por el principio de responsabilidad única (*Single Responsibility Principle*):

```
HTTP Request
     │
     ▼
[ Express Router ] ─── Enrutamiento y asignación de endpoints
     │
     ▼
[ Middlewares ] ────── Rate Limiting, Auth JWT (RBAC), Subida de archivos
     │
     ▼
[ Zod Validator ] ──── Validación de esquema e inferencia de tipos estáticos
     │
     ▼
[ Controller ] ─────── Parseo de peticiones y serialización de respuestas
     │
     ▼
[ Domain Service ] ─── Toda la lógica de negocio, cálculos de progreso y validaciones
     │
     ▼
[ Prisma Client ] ──── Consultas parametrizadas contra PostgreSQL 16
     │
     ▼
JSON Response ──────── Formato de sobre estándar: { success, data, error, meta }
```

---

## 📦 Módulos del Sistema

| Módulo | Responsabilidad Principal | Endpoints Clave |
| :--- | :--- | :--- |
| **`auth`** | Registro, inicio de sesión, bloqueo de cuenta y rotación de tokens. | `POST /api/auth/register`<br/>`POST /api/auth/login`<br/>`POST /api/auth/refresh`<br/>`POST /api/auth/logout` |
| **`readings`** | Gestión de textos, filtrado por nivel pedagógico y control de ciclo de vida (`DRAFT`, `PUBLISHED`, `ARCHIVED`). | `GET /api/readings`<br/>`POST /api/readings`<br/>`GET /api/readings/:id`<br/>`PUT /api/readings/:id`<br/>`PATCH /api/readings/:id/publish` |
| **`questions`** | Preguntas anidadas por lectura, tipos de reactivo y aprobación editorial. | `GET /api/readings/:id/questions`<br/>`POST /api/readings/:id/questions`<br/>`PATCH /api/readings/:id/questions/:qId/approve` |
| **`progress`** | Motor de evaluación de cuestionarios, cálculo de aciertos ($\ge 70\%$), puntos, racha y subida de nivel. | `POST /api/progress/submit`<br/>`GET /api/progress/me`<br/>`GET /api/progress/history` |
| **`media`** | Subida y validación de firmas binarias de imágenes bajo el patrón `StorageProvider`. | `POST /api/media/upload` |
| **`stats`** | Agregación de métricas de desempeño, estudiantes activos y top de lecturas. | `GET /api/stats/dashboard` |
| **`ai`** | Generación asistida de cuestionarios mediante LLMs locales vía Ollama. | `POST /api/ai/generate-questions` |
| **`users`** | Perfiles de usuario, roles de acceso y administración de estudiantes. | `GET /api/users/me`<br/>`GET /api/users` |

---

## 🛡️ Protocolo de Respuestas API (Envelope Pattern)

Todas las respuestas de la API cumplen con un contrato predecible y estandarizado:

```json
{
  "success": true,
  "data": {
    "id": "cm70abc123",
    "title": "El quetzal y la montaña",
    "comprehensionLevel": "LITERAL"
  },
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

En caso de error (`4xx` o `5xx`):
```json
{
  "success": false,
  "data": null,
  "error": "Credenciales inválidas"
}
```

---

## 🔒 Controles de Seguridad Implementados

1. **Rotación y Familia de Refresh Tokens:** Cada refresco invalida el token previo y genera uno nuevo. Si un token revocado es presentado, el sistema detecta posible robo de credenciales y revoca de inmediato la familia completa de tokens del usuario.
2. **Mitigación de Ataques de Fuerza Bruta:**
   - Rate limiters granulares por IP (`express-rate-limit`): 10 intentos/min para login, 5/min para registro, 3/min para IA.
   - Bloqueo transaccional de cuenta tras 5 intentos fallidos (`failedLoginAttempts >= 5` → `lockedUntil = now + 15min`).
3. **Subida de Archivos Blindada:**
   - Inspección binaria obligatoria (*magic bytes*) de encabezados JPEG, PNG y WebP.
   - Nombres aleatorizados con UUIDv4 para neutralizar *Path Traversal*.
   - Bandera `wx` de escritura exclusiva para impedir la sobreescritura accidental o malintencionada de ficheros.
4. **Sanitización de Contenido:** Eliminación de etiquetas y scripts peligrosos mediante sanitizador HTML dedicado en todos los inputs de usuario y respuestas de IA.

---

## 🦙 Módulo de IA Local (Ollama)

El módulo `ai` permite a los administradores generar preguntas de opción múltiple contextualizadas al texto de una lectura sin depender de servicios en la nube:

* **Servidor Local:** Conexión nativa con Ollama en `http://localhost:11434` (configurable mediante `OLLAMA_HOST`).
* **Modelo Sugerido:** `llama3.2` o `qwen2.5:7b`.
* **Ciclo de Aprobación Humana:** Todas las preguntas generadas ingresan a la base de datos con estado `DRAFT`. Deben ser auditadas y aprobadas explícitamente por un docente o administrador antes de contar para el umbral mínimo de publicación de la lectura (≥ 5 preguntas aprobadas).

---

## 🧪 Pruebas Automatizadas

El backend cuenta con **233 pruebas automatizadas** que cubren servicios, validadores, middlewares, contratos y pruebas de mutación:

```bash
# Ejecutar toda la suite de pruebas
pnpm test

# Ejecutar pruebas en modo observador (watch)
pnpm test:watch

# Ejecutar reporte de cobertura de código
pnpm test:coverage
```

### Comandos de Utilidad

```bash
# Servidor de desarrollo con recarga en vivo
pnpm dev

# Typecheck estricto de TypeScript
pnpm typecheck

# Linter de código
pnpm lint

# Aplicar migraciones a la base de datos
pnpm exec prisma migrate dev

# Abrir Prisma Studio (UI de exploración de base de datos)
pnpm exec prisma studio
```

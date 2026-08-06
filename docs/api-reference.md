# API Reference — LectoApp

**Documento:** API REST Reference  
**Base URL:** `http://localhost:3000/api`  
**Versión:** 1.0  
**Auth:** JWT Bearer Token  
**Fecha:** Agosto 2026

---

## Convenciones

### Autenticación
Todos los endpoints (excepto auth) requieren el header:
```
Authorization: Bearer <access_token>
```

### Formato de respuesta
```json
{
  "success": true | false,
  "data": { ... } | [ ... ] | null,
  "error": "mensaje de error" | null,
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Paginación
Endpoints de listado aceptan query params:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sortBy` (varía por endpoint)
- `sortOrder` (`asc` | `desc`, default: `desc`)

### Códigos de estado HTTP

| Código | Significado |
|--------|------------|
| 200 | OK — Recurso retornado o actualizado exitosamente |
| 201 | Created — Recurso creado exitosamente |
| 204 | No Content — Operación exitosa sin body |
| 400 | Bad Request — Input inválido (error de validación) |
| 401 | Unauthorized — Token ausente o expirado |
| 403 | Forbidden — Sin permisos para esta acción |
| 404 | Not Found — Recurso no encontrado |
| 409 | Conflict — Conflicto (email duplicado, etc.) |
| 429 | Too Many Requests — Rate limit excedido |
| 500 | Internal Server Error — Error inesperado |

---

## 1. Auth (`/api/auth`)

### POST `/api/auth/register`
Registrar un nuevo usuario (estudiante).

**Auth:** No requerida  
**Rate Limit:** 5 req/min

**Body:**
```json
{
  "name": "María López",
  "email": "maria@ejemplo.com",
  "password": "MiPassword123!",
  "gradeLevel": "5to Primaria"
}
```

**Validación:**
| Campo | Reglas |
|-------|--------|
| name | string, 2–100 caracteres |
| email | email válido, único |
| password | min 8 caracteres |
| gradeLevel | string, opcional |

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1abc...",
      "name": "María López",
      "email": "maria@ejemplo.com",
      "role": "STUDENT",
      "currentLevel": "BEGINNER",
      "totalPoints": 0
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "error": null
}
```

**Errores:**
| Código | Error |
|--------|-------|
| 400 | Validación fallida |
| 409 | Email ya registrado |

---

### POST `/api/auth/login`
Iniciar sesión.

**Auth:** No requerida  
**Rate Limit:** 10 req/min

**Body:**
```json
{
  "email": "maria@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1abc...",
      "name": "María López",
      "email": "maria@ejemplo.com",
      "role": "STUDENT",
      "currentLevel": "INTERMEDIATE",
      "totalPoints": 450,
      "streak": 5
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "error": null
}
```

**Errores:**
| Código | Error |
|--------|-------|
| 401 | Credenciales inválidas |
| 429 | Cuenta bloqueada temporalmente (5 intentos fallidos) |

---

### POST `/api/auth/refresh`
Obtener nuevo access token usando refresh token.

**Auth:** No requerida  
**Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...(nuevo)",
    "refreshToken": "eyJhbGci...(nuevo, rotado)"
  },
  "error": null
}
```

**Nota:** Implementa refresh token rotation — el token anterior se invalida al usarse.

---

### POST `/api/auth/logout`
Cerrar sesión (invalida refresh tokens).

**Auth:** Bearer token  
**Response:** 204 No Content

---

## 2. Readings (`/api/readings`)

### GET `/api/readings`
Listar lecturas.

**Auth:** Bearer token  
**Roles:** STUDENT (solo publicadas) | ADMIN (todas)

**Query Params:**
| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| page | number | 1 | Página |
| limit | number | 20 | Items por página (max 100) |
| comprehensionLevel | enum | — | LITERAL, INFERENTIAL, CRITICAL |
| progressionLevel | enum | — | BEGINNER, INTERMEDIATE, etc. |
| status | enum | — | DRAFT, PUBLISHED, ARCHIVED (solo admin) |
| sortBy | string | createdAt | createdAt, title, order |
| sortOrder | string | desc | asc, desc |
| search | string | — | Buscar en título |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx1234...",
      "title": "El Popol Vuh: Origen del Mundo",
      "comprehensionLevel": "LITERAL",
      "progressionLevel": "BEGINNER",
      "status": "PUBLISHED",
      "coverImageUrl": "https://storage.../cover.jpg",
      "estimatedTimeMin": 8,
      "questionsCount": 10,
      "createdAt": "2026-08-15T10:30:00Z"
    }
  ],
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 47, "totalPages": 3 }
}
```

---

### GET `/api/readings/:id`
Obtener una lectura con sus preguntas.

**Auth:** Bearer token  
**Roles:** STUDENT (solo publicadas) | ADMIN (todas)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clx1234...",
    "title": "El Popol Vuh: Origen del Mundo",
    "content": "En el principio, todo era silencio y oscuridad...",
    "comprehensionLevel": "LITERAL",
    "progressionLevel": "BEGINNER",
    "status": "PUBLISHED",
    "coverImageUrl": "https://storage.../cover.jpg",
    "estimatedTimeMin": 8,
    "order": 1,
    "questions": [
      {
        "id": "clxq001...",
        "statement": "¿Qué había al principio según el texto?",
        "type": "MULTIPLE_CHOICE",
        "options": [
          { "id": "a", "text": "Silencio y oscuridad" },
          { "id": "b", "text": "Luz y agua" },
          { "id": "c", "text": "Tierra y fuego" },
          { "id": "d", "text": "Animales y plantas" }
        ],
        "order": 1
      }
    ],
    "author": {
      "id": "clxadm...",
      "name": "Admin"
    },
    "createdAt": "2026-08-15T10:30:00Z",
    "updatedAt": "2026-08-15T10:30:00Z"
  },
  "error": null
}
```

**Nota para estudiantes:** `correctAnswer` y `explanation` NO se incluyen en el GET. Solo se revelan en el response de POST `/api/progress/submit`.

**Vista ADMIN:** cuando el rol es ADMIN, cada objeto en `questions[]` incluye además `correctAnswer`, `explanation`, `isAiGenerated` y `status` (igual que en `GET /api/readings/:readingId/questions`) y el listado incluye preguntas en cualquier `status` (DRAFT y APPROVED), no solo las aprobadas:
```json
{
  "id": "clxq001...",
  "statement": "¿Qué había al principio según el texto?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    { "id": "a", "text": "Silencio y oscuridad" },
    { "id": "b", "text": "Luz y agua" },
    { "id": "c", "text": "Tierra y fuego" },
    { "id": "d", "text": "Animales y plantas" }
  ],
  "correctAnswer": "a",
  "explanation": "El texto dice explícitamente...",
  "order": 1,
  "isAiGenerated": false,
  "status": "APPROVED"
}
```

---

### POST `/api/readings`
Crear nueva lectura.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Body:**
```json
{
  "title": "El Popol Vuh: Origen del Mundo",
  "content": "En el principio, todo era silencio y oscuridad...",
  "comprehensionLevel": "LITERAL",
  "progressionLevel": "BEGINNER",
  "coverImageUrl": "https://storage.../cover.jpg",
  "estimatedTimeMin": 8,
  "order": 1
}
```

**Response 201:** Lectura creada (status: DRAFT)

---

### PUT `/api/readings/:id`
Actualizar lectura.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Body:** Campos parciales (solo los que se actualizan)

**Response 200:** Lectura actualizada

---

### PATCH `/api/readings/:id/publish`
Publicar una lectura (cambiar status a PUBLISHED).

**Auth:** Bearer token  
**Roles:** ADMIN only

**Validación:** La lectura debe tener al menos 5 preguntas con `status: APPROVED`. Las preguntas en `DRAFT` (p. ej. generadas por IA sin revisar) no cuentan.

**Response 200:** Lectura con status PUBLISHED

**Errores:**
| Código | Error |
|--------|-------|
| 400 | La lectura necesita al menos 5 preguntas aprobadas para publicarse |

---

### PATCH `/api/readings/:id/archive`
Archivar una lectura (soft delete visual).

**Auth:** Bearer token  
**Roles:** ADMIN only

**Response 200:** Lectura con status ARCHIVED

---

### DELETE `/api/readings/:id`
Soft delete de una lectura.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Response 204:** No Content

---

## 3. Questions (`/api/readings/:readingId/questions`)

### GET `/api/readings/:readingId/questions`
Listar preguntas de una lectura.

**Auth:** Bearer token  
**Roles:** STUDENT (solo `status: APPROVED`) | ADMIN (todas, o filtradas por `status`)

**Query Params (solo ADMIN):**
| Param | Tipo | Descripción |
|-------|------|-------------|
| status | enum | `DRAFT` \| `APPROVED` — filtrar por estado de revisión |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxq001...",
      "statement": "¿Qué había al principio según el texto?",
      "type": "MULTIPLE_CHOICE",
      "options": [
        { "id": "a", "text": "Silencio y oscuridad" },
        { "id": "b", "text": "Luz y agua" },
        { "id": "c", "text": "Tierra y fuego" },
        { "id": "d", "text": "Animales y plantas" }
      ],
      "correctAnswer": "a",
      "explanation": "El texto dice explícitamente...",
      "order": 1,
      "isAiGenerated": false,
      "status": "APPROVED"
    },
    {
      "id": "clxq002...",
      "statement": "El Popol Vuh es un texto de origen maya k'iche'.",
      "type": "TRUE_FALSE",
      "options": [
        { "id": "true", "text": "Verdadero" },
        { "id": "false", "text": "Falso" }
      ],
      "correctAnswer": "true",
      "explanation": "El texto lo menciona en el primer párrafo.",
      "order": 2,
      "isAiGenerated": false,
      "status": "APPROVED"
    }
  ],
  "error": null
}
```

**Nota:** `correctAnswer`, `explanation` y `status` solo visibles para ADMIN. Los estudiantes nunca ven preguntas en `DRAFT`.

---

### POST `/api/readings/:readingId/questions`
Crear pregunta para una lectura.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Body (MULTIPLE_CHOICE):**
```json
{
  "statement": "¿Qué había al principio según el texto?",
  "type": "MULTIPLE_CHOICE",
  "options": [
    { "id": "a", "text": "Silencio y oscuridad" },
    { "id": "b", "text": "Luz y agua" },
    { "id": "c", "text": "Tierra y fuego" },
    { "id": "d", "text": "Animales y plantas" }
  ],
  "correctAnswer": "a",
  "explanation": "El texto dice explícitamente que al principio todo era silencio y oscuridad.",
  "order": 1
}
```

**Body (TRUE_FALSE):**
```json
{
  "statement": "El Popol Vuh es un texto de origen maya k'iche'.",
  "type": "TRUE_FALSE",
  "options": [
    { "id": "true", "text": "Verdadero" },
    { "id": "false", "text": "Falso" }
  ],
  "correctAnswer": "true",
  "explanation": "El texto lo menciona en el primer párrafo.",
  "order": 2
}
```

**Nota:** las preguntas creadas manualmente por el admin nacen con `status: APPROVED` (el admin es la revisión). Solo las generadas por IA (`POST /api/ai/generate`) nacen en `DRAFT` — ver sección 9.

**Response 201:** Pregunta creada

---

### PUT `/api/readings/:readingId/questions/:id`
Actualizar pregunta.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Body:** Campos parciales (solo los que se actualizan) — mismos campos que `POST`, todos opcionales.

**Validación cruzada:** las mismas invariantes de `POST` aplican, pero solo se evalúan cuando los campos relevantes vienen presentes en el payload (no se re-validan contra el estado ya persistido en BD):
- Si viene `options` y `correctAnswer`: `correctAnswer` debe coincidir con el `id` de una de las `options` enviadas.
- Si viene `options` y `type`: la cantidad/ids de `options` debe corresponder al `type` (`MULTIPLE_CHOICE` → exactamente 4 opciones; `TRUE_FALSE` → opciones con ids `true` y `false`).
- Si viene `options` sin `type`, no se evalúa la regla de cardinalidad (no se puede saber contra qué tipo validar) — solo se valida `correctAnswer` si también viene.

**Errores:**
| Código | Error |
|--------|-------|
| 400 | `Las preguntas de opción múltiple deben tener exactamente 4 opciones` |
| 400 | `Las preguntas de verdadero/falso deben tener opciones con id "true" y "false"` |
| 400 | `correctAnswer debe coincidir con el id de una de las opciones` |

---

### DELETE `/api/readings/:readingId/questions/:id`
Eliminar pregunta.

**Auth:** Bearer token  
**Roles:** ADMIN only

---

### PATCH `/api/readings/:readingId/questions/:id/approve`
Aprobar una pregunta en `DRAFT` (parte del flujo de revisión editorial, típicamente para preguntas generadas por IA). Cambia `status` a `APPROVED`.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Response 200:** Pregunta con `status: APPROVED`

**Errores:**
| Código | Error |
|--------|-------|
| 400 | La pregunta ya está aprobada |

---

## 4. Progress (`/api/progress`)

### POST `/api/progress/submit`
Enviar respuestas de un cuestionario.

**Auth:** Bearer token  
**Roles:** STUDENT only

**Body:**
```json
{
  "readingId": "clx1234...",
  "answers": [
    { "questionId": "clxq001...", "selectedAnswer": "a" },
    { "questionId": "clxq002...", "selectedAnswer": "c" },
    { "questionId": "clxq003...", "selectedAnswer": "b" }
  ],
  "timeSpentSec": 245
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "attempt": {
      "id": "clxa001...",
      "score": 8,
      "totalQuestions": 10,
      "percentage": 80.0,
      "passed": true,
      "timeSpentSec": 245,
      "results": [
        {
          "questionId": "clxq001...",
          "selectedAnswer": "a",
          "correctAnswer": "a",
          "isCorrect": true,
          "explanation": "El texto dice explícitamente..."
        },
        {
          "questionId": "clxq002...",
          "selectedAnswer": "c",
          "correctAnswer": "b",
          "isCorrect": false,
          "explanation": "La respuesta correcta es B porque..."
        }
      ]
    },
    "progress": {
      "bestScore": 80.0,
      "attempts": 2,
      "completed": true,
      "isNewCompletion": true
    },
    "rewards": {
      "pointsEarned": 100,
      "totalPoints": 550,
      "levelUp": false,
      "newLevel": null
    }
  },
  "error": null
}
```

---

### GET `/api/progress/me`
Obtener progreso general del estudiante autenticado.

**Auth:** Bearer token  
**Roles:** STUDENT only

**Response 200:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalReadings": 47,
      "completedReadings": 12,
      "overallPercentage": 25.5
    },
    "byComprehensionLevel": {
      "LITERAL": { "total": 15, "completed": 8, "percentage": 53.3 },
      "INFERENTIAL": { "total": 17, "completed": 3, "percentage": 17.6 },
      "CRITICAL": { "total": 15, "completed": 1, "percentage": 6.7 }
    },
    "byProgressionLevel": {
      "BEGINNER": { "total": 10, "completed": 10, "percentage": 100 },
      "INTERMEDIATE": { "total": 10, "completed": 2, "percentage": 20 },
      "ADVANCED": { "total": 10, "completed": 0, "percentage": 0 },
      "EXPERT": { "total": 10, "completed": 0, "percentage": 0 },
      "SUPREME": { "total": 7, "completed": 0, "percentage": 0 }
    },
    "currentLevel": "INTERMEDIATE",
    "streak": 5,
    "totalPoints": 550
  },
  "error": null
}
```

---

### GET `/api/progress/reading/:readingId`
Obtener progreso del estudiante en una lectura específica.

**Auth:** Bearer token  
**Roles:** STUDENT only

**Response 200:**
```json
{
  "success": true,
  "data": {
    "readingId": "clx1234...",
    "bestScore": 80.0,
    "attempts": 2,
    "completed": true,
    "completedAt": "2026-08-20T14:30:00Z",
    "history": [
      { "attemptId": "clxa001", "percentage": 60.0, "passed": false, "createdAt": "2026-08-19T10:00:00Z" },
      { "attemptId": "clxa002", "percentage": 80.0, "passed": true, "createdAt": "2026-08-20T14:30:00Z" }
    ]
  },
  "error": null
}
```

---

## 5. Users (`/api/users`)

### GET `/api/users/me`
Obtener perfil del usuario autenticado.

**Auth:** Bearer token

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "clx1abc...",
    "name": "María López",
    "email": "maria@ejemplo.com",
    "role": "STUDENT",
    "avatarUrl": "https://storage.../avatar.png",
    "gradeLevel": "5to Primaria",
    "currentLevel": "INTERMEDIATE",
    "totalPoints": 550,
    "streak": 5,
    "createdAt": "2026-08-10T09:00:00Z"
  },
  "error": null
}
```

---

### PUT `/api/users/me`
Actualizar perfil del usuario autenticado.

**Auth:** Bearer token  
**Body:** `{ name, gradeLevel, avatarUrl }`

---

### GET `/api/users` (Admin only)
Listar todos los usuarios.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Query Params:** page, limit, role, search (por nombre o email)

---

## 6. Stats (`/api/stats`)

### GET `/api/stats/dashboard`
Métricas agregadas para el Dashboard del panel admin.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Query Params:**
| Param | Tipo | Default | Rango | Descripción |
|-------|------|---------|-------|-------------|
| topLimit | number | 5 | 1–20 | Cantidad de lecturas en `topReadings` |
| activeWithinDays | number | 7 | 1–90 | Ventana en días para considerar un estudiante "activo" (`lastActiveAt >= now - N días`, inclusivo) |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "readings":  { "total": 12, "byStatus": { "DRAFT": 3, "PUBLISHED": 8, "ARCHIVED": 1 } },
    "questions": { "total": 60, "byStatus": { "DRAFT": 10, "APPROVED": 50 } },
    "students":  {
      "total": 40, "active": 12, "activeWithinDays": 7,
      "byProgressionLevel": { "BEGINNER": 20, "INTERMEDIATE": 12, "ADVANCED": 5, "EXPERT": 2, "SUPREME": 1 }
    },
    "quizAttempts": { "total": 130, "passed": 90, "passRatePercentage": 69.2, "averageScorePercentage": 71.4 },
    "topReadings": [
      { "readingId": "clx1234...", "title": "El Popol Vuh", "completions": 18, "averageScorePercentage": 84.3 }
    ]
  },
  "error": null
}
```

**Sin `meta`** — no es un endpoint paginado. `topReadings` siempre es un array (nunca `null`), incluso vacío.

**Invariantes:**
- Respeta soft delete: lecturas, preguntas (vía relación con su lectura) y estudiantes borrados quedan fuera de sus respectivos conteos.
- `quizAttempts` es histórico y **no** filtra por `reading.deletedAt` — un intento ya ocurrido sigue contando aunque la lectura se haya borrado después. `topReadings` sí excluye lecturas borradas.
- `passed` se lee del campo persistido en `QuizAttempt` (no se recalcula el umbral de 70%, que vive únicamente en `progress.service.ts`).
- `quizAttempts.averageScorePercentage` = promedio de `percentage` sobre **todos** los intentos (histórico global).
- `topReadings[].averageScorePercentage` = promedio de `bestScore` de `StudentProgress` con `completed: true` para esa lectura — semántica distinta de `quizAttempts.averageScorePercentage` (mejor puntaje por estudiante vs. cada intento individual).
- Todos los porcentajes se redondean a 1 decimal en el backend.
- Las 3 claves de `ReadingStatus`, las 2 de `QuestionStatus` y las 5 de `ProgressionLevel` siempre están presentes en la respuesta, con `0` si no hay datos.
- `topReadings` está ordenado por `completions desc`, con tie-break por `readingId asc` (orden determinista).

**Errores:**
| Código | Error |
|--------|-------|
| 400 | `topLimit` o `activeWithinDays` fuera de rango o no numérico |
| 401 | Token ausente o expirado |
| 403 | Rol distinto de ADMIN |

---

## 7. Media (`/api/media`)

### POST `/api/media/upload`
Subir un archivo (imagen de portada de lectura o avatar) a Cloud Storage y obtener su URL pública.

**Auth:** Bearer token  
**Roles:** ADMIN (portadas de lectura) | STUDENT (avatar propio, si aplica)  
**Content-Type:** `multipart/form-data`  
**Rate Limit:** 20 req/min

**Body (form-data):**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| file | File | Imagen (jpg, png, webp). Máx 5 MB |
| type | string | `reading-cover` \| `avatar` |

**Response 201 (provider actual: disco local, ver ARCHITECTURE.md ADR-007):**
```json
{
  "success": true,
  "data": {
    "url": "http://localhost:3000/uploads/covers/3f6a9c2e-8b1d-4e2a-9c3f-1a2b3c4d5e6f.webp"
  },
  "error": null
}
```

**Nota:** el nombre del archivo (`3f6a9c2e-...webp`) lo genera siempre el servidor (UUID + extensión derivada de los magic bytes detectados) — el `originalname` que envía el cliente se ignora por completo y nunca se usa para nombrar ni ubicar el archivo en disco.

**Regla canónica de códigos de error** (evita solapamiento): si la causa es que el archivo excede el tamaño máximo (5 242 880 bytes exactos son válidos; 5 242 881 ya no) el código es siempre **413**. Cualquier otro motivo de invalidez (archivo ausente, vacío, tipo no soportado por contenido, `type` inválido, más de un archivo, fieldname incorrecto, rol sin permiso) es **400** (o **403** para el caso específico de permisos).

**Errores:**
| Código | Error |
|--------|-------|
| 400 | `Debes adjuntar un archivo en el campo "file"` |
| 400 | `Solo se permite un archivo en el campo "file"` (dos archivos o fieldname distinto de `file`) |
| 400 | `Tipo de archivo no soportado. Formatos permitidos: jpg, png, webp` (validado por magic bytes, no por `Content-Type` ni extensión declarados) |
| 400 | Errores de validación de `type` (Zod) |
| 403 | `Tu rol no puede subir archivos de tipo "<type>"` |
| 413 | `El archivo supera el tamaño máximo de 5 MB` |

**Nota:** la URL devuelta es la que se usa luego en `coverImageUrl` (POST/PUT `/api/readings`) o `avatarUrl` (PUT `/api/users/me`). Este endpoint solo sube el archivo — no crea ni actualiza ningún recurso.

---

## 8. Avatar Shop (`/api/avatar-items`) — Fase 3

### GET `/api/avatar-items`
Listar catálogo de accesorios de avatar.

**Auth:** Bearer token

**Query Params:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| category | enum | HAT, SHIRT, PANTS, SHOES, ACCESSORY, BACKGROUND |
| owned | boolean | Si es `true`, filtra solo los ítems que ya posee el usuario autenticado |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxi001...",
      "name": "Sombrero de explorador",
      "category": "HAT",
      "imageUrl": "https://storage.../hat-explorer.png",
      "price": 150,
      "rarity": "RARE",
      "isDefault": false,
      "owned": false,
      "equipped": false
    }
  ],
  "error": null
}
```

---

### POST `/api/avatar-items/:id/purchase`
Comprar un accesorio con los puntos del usuario autenticado.

**Auth:** Bearer token  
**Roles:** STUDENT only

**Response 200:**
```json
{
  "success": true,
  "data": {
    "item": { "id": "clxi001...", "name": "Sombrero de explorador" },
    "totalPointsRemaining": 400
  },
  "error": null
}
```

**Errores:**
| Código | Error |
|--------|-------|
| 400 | Puntos insuficientes |
| 409 | El usuario ya posee este ítem |

---

### PATCH `/api/avatar-items/:id/equip`
Equipar (o desequipar) un accesorio ya comprado. Solo puede haber un ítem equipado por `category` a la vez.

**Auth:** Bearer token  
**Roles:** STUDENT only

**Body:**
```json
{ "equipped": true }
```

**Response 200:** Ítem actualizado

**Errores:**
| Código | Error |
|--------|-------|
| 403 | El usuario no posee este ítem |

---

## 9. AI — Generación de Preguntas (`/api/ai`) — Fase 2

**Flujo completo (draft → review → approve):**

1. Admin llama `POST /api/ai/generate` → se encola un job.
2. El worker genera las preguntas con Gemini y las **persiste directamente** como filas `Question` con `isAiGenerated: true` y `status: DRAFT`, asociadas al `readingId`.
3. Admin consulta `GET /api/ai/jobs/:jobId` para saber cuándo terminó, y luego revisa las preguntas con `GET /api/readings/:readingId/questions?status=DRAFT`.
4. Admin edita si hace falta (`PUT /api/readings/:readingId/questions/:id`) y aprueba una por una con `PATCH /api/readings/:readingId/questions/:id/approve`.
5. Solo entonces esas preguntas cuentan para el mínimo de 5 requerido en `PATCH /api/readings/:id/publish`.

### POST `/api/ai/generate`
Generar preguntas con IA para una lectura.

**Auth:** Bearer token  
**Roles:** ADMIN only

**Body:**
```json
{
  "readingId": "clx1234...",
  "comprehensionLevel": "INFERENTIAL",
  "numberOfQuestions": 10
}
```

**Response 202 (Accepted):**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "PROCESSING",
    "message": "Generando preguntas... Esto puede tomar 10-30 segundos."
  },
  "error": null
}
```

### GET `/api/ai/jobs/:jobId`
Consultar estado de un job de generación. Al completarse, las preguntas ya existen en la base de datos (`status: DRAFT`) — este endpoint solo informa el progreso y devuelve sus IDs para que el admin navegue directo a revisarlas.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "status": "COMPLETED",
    "readingId": "clx1234...",
    "createdQuestionIds": ["clxq010...", "clxq011...", "clxq012..."]
  },
  "error": null
}
```

**Estados posibles de `status`:** `PROCESSING` | `COMPLETED` | `FAILED`

---

## 10. Leaderboard (`/api/leaderboard`) — Fase 3

### GET `/api/leaderboard`
Obtener ranking Top 10 + posición del usuario.

**Auth:** Bearer token

**Response 200:**
```json
{
  "success": true,
  "data": {
    "top10": [
      { "rank": 1, "userId": "...", "name": "Carlos M.", "totalPoints": 2450, "level": "EXPERT" },
      { "rank": 2, "userId": "...", "name": "Ana R.", "totalPoints": 2100, "level": "ADVANCED" }
    ],
    "myPosition": {
      "rank": 47,
      "totalPoints": 550,
      "level": "INTERMEDIATE"
    }
  },
  "error": null
}
```

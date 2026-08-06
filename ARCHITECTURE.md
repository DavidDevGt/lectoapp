# ARCHITECTURE.md — LectoApp

**Documento:** Arquitectura del Sistema  
**Versión:** 1.1 — corrige inconsistencias con la implementación real (errores, endpoints, flujo de IA) y agrega vistas C4, trazabilidad de NFRs, topología de despliegue, versionado de API, registro de riesgos y dimensionamiento de capacidad  
**Rol:** Software Solutions Architect  
**Fecha:** Agosto 2026

> **Nota de veracidad:** todo lo marcado como "✅ Implementado" en este documento fue verificado contra el código real (tests pasando, `curl` contra una base de datos real) — no es aspiracional. Lo marcado "🔲 Fase 2/3" o "planeado" es diseño, no código existente.

---

## 1. Visión General

LectoApp sigue una **arquitectura de tres capas** con una API REST central como punto de integración. Todos los clientes (app móvil, panel admin) se comunican exclusivamente a través de la API — no hay acceso directo a base de datos desde ningún frontend.

```
┌──────────────────────────────────────────────────────────────┐
│                       CLIENTES                               │
│                                                              │
│  ┌─────────────────────┐     ┌─────────────────────────┐    │
│  │   App Móvil Flutter  │     │  Panel Admin React/Vite  │   │
│  │   (Estudiante)       │     │  (Administrador)         │   │
│  │   Android 8+         │     │  Web (Chrome/Firefox)    │   │
│  │   🔲 Fase 2 (no      │     │  ✅ Implementado          │   │
│  │      iniciado)       │     │                          │   │
│  └──────────┬──────────┘     └──────────┬──────────────┘    │
│             │                            │                   │
└─────────────┼────────────────────────────┼───────────────────┘
              │         HTTPS              │
              ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     API REST (Node.js/Express) — ✅           │
│                                                              │
│  ┌────────┐┌────────┐┌────────┐┌────────┐┌───────┐┌───────┐ │
│  │  Auth  ││Readings││Progress││ Users  ││ Media ││ Stats │ │
│  └────────┘└────────┘└────────┘└────────┘└───────┘└───────┘ │
│  ┌────────┐                                                 │
│  │Questions│  ┌────────────────┐  ┌──────────────────────┐  │
│  └────────┘  │  AI 🔲 Fase 2   │  │ Gamification 🔲 Fase 3│  │
│              └────────────────┘  └──────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Middleware Layer — ✅                       │   │
│  │  (Auth, Validation, Error Handling, Rate Limiting)    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┼─────────────────┬─────────────────┐
              ▼            ▼                 ▼                 ▼
       ┌───────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │ PostgreSQL │ │ Disco local  │ │  Redis 🔲    │ │ Google Cloud │
       │  (Prisma)  │ │ (imágenes,   │ │  Fase 2      │ │ Storage 🔲   │
       │     ✅      │ │  ✅ hoy)     │ │ (cache+jobs) │ │ (imágenes,   │
       └───────────┘ └──────────────┘ └──────────────┘ │  reemplaza   │
                                                          │  disco local)│
                                                          └──────────────┘
                                                                 │
                                                          ┌──────────────┐
                                                          │  Gemini API  │
                                                          │  🔲 Fase 2   │
                                                          │ (Gen. de     │
                                                          │  preguntas)  │
                                                          └──────────────┘
```

**Cómo leer este diagrama:** ✅ = corriendo hoy contra datos reales (verificado con tests + `curl`). 🔲 = diseñado pero no implementado. El `MediaService` ya está escrito contra una interfaz `StorageProvider` (ADR-007) precisamente para que activar GCS más adelante sea cambiar el provider, no reescribir el módulo.

### 1.1 Vista de Contexto (C4 Nivel 1)

Quién usa el sistema y con qué sistemas externos habla — sin entrar todavía en tecnología interna.

```
                    ┌─────────────────────┐
                    │     Estudiante      │
                    │ (primaria/secundaria)│
                    └──────────┬──────────┘
                               │ usa
                               ▼
   ┌───────────────┐   ┌──────────────────┐   ┌───────────────────┐
   │ Google Play    │◄──┤                  ├──►│  Gemini API        │
   │ Store          │   │                  │   │  (Google)          │
   │ (distribución  │   │    LectoApp      │   │  🔲 Fase 2         │
   │  🔲 Fase 2)    │   │  (este sistema)  │   │  genera preguntas  │
   └───────────────┘   │                  │   └───────────────────┘
                        │                  │
                        │                  ├──►┌───────────────────┐
                        │                  │   │ Google Cloud       │
                        └────────┬─────────┘   │ Storage 🔲 Fase 2+ │
                                 │              │ (imágenes)         │
                                 │ usa          └───────────────────┘
                                 ▼
                    ┌─────────────────────┐
                    │   Administrador      │
                    │ (Giovanni y su equipo)│
                    └─────────────────────┘
```

**Fuera del alcance de este sistema (integraciones que el cliente NO pidió — ver PRD.md sección 9):** sistemas del MINEDUC/SIE, pasarelas de pago, proveedores de SSO externos.

### 1.2 Vista de Contenedores (C4 Nivel 2)

El diagrama de la sección 1 (arriba) **es** la vista de contenedores: cada caja de segundo nivel (App Móvil, Panel Admin, API REST, PostgreSQL, disco local/GCS, Redis, Gemini API) es un "contenedor" en términos C4 — una unidad desplegable de forma independiente, con su propia tecnología. No se duplica aquí para evitar que los dos diagramas diverjan con el tiempo; cualquier cambio de contenedores se hace en la sección 1.

---

## 2. Principios Arquitectónicos

| Principio | Aplicación en LectoApp |
|-----------|----------------------|
| **Separation of Concerns** | Backend dividido en módulos independientes por dominio |
| **Single Responsibility** | Cada capa (controller/service/validator) tiene una sola responsabilidad |
| **API-First** | Todo pasa por la API — no hay "atajos" directos a la BD |
| **Fail Fast** | Validación en el borde (Zod validators) antes de llegar al service |
| **Stateless Server** | JWT para auth, no sesiones en servidor — escala horizontal sin problemas |
| **Soft Delete** | Nunca se borran datos — campo `deletedAt` para recuperabilidad |
| **Convention over Configuration** | Estructura de módulos predecible y consistente |

---

## 3. Componentes del Sistema

### 3.1 Backend — API REST

#### Patrón: Modular Service Layer

```
Request
  │
  ▼
Route (Express Router)
  │
  ▼
Middleware (Auth → Rate Limit → CORS)
  │
  ▼
Validator (Zod Schema)
  │  ← Rechaza si input inválido (400 Bad Request)
  ▼
Controller
  │  ← Solo parsea request y formatea response
  ▼
Service
  │  ← TODA la lógica de negocio vive aquí
  │  ← Validaciones de dominio, transformaciones, orquestación
  ▼
Prisma Client
  │  ← Acceso a datos, queries tipadas
  ▼
PostgreSQL
```

#### Módulos del backend

| Módulo | Responsabilidad | Dependencias | Estado |
|--------|----------------|-------------|--------|
| `auth` | Registro, login, refresh token, roles | Prisma, bcrypt, JWT | ✅ Implementado |
| `users` | CRUD de usuarios, perfil, avatar | Prisma | ✅ Implementado |
| `readings` | CRUD de lecturas, estados, clasificación | Prisma | ✅ Implementado |
| `questions` | CRUD de preguntas, flujo DRAFT→APPROVED | Prisma | ✅ Implementado |
| `progress` | Tracking de avance, intentos, puntajes, rachas, level-up | Prisma | ✅ Implementado |
| `media` | Upload de imágenes (magic-byte validation, role matrix) | StorageProvider | ✅ Implementado (LocalDisk en Fase 1, GCS en prod) |
| `stats` | Dashboard de métricas para admin | Prisma | ✅ Implementado |
| `ai` | Generación de preguntas con Gemini | Gemini API, Queue | 🔲 Fase 2 |
| `gamification` | Puntos, leaderboard, tienda (Fase 3) | Prisma, Redis | 🔲 Fase 3 |

#### Manejo de errores centralizado

Clases reales en `backend/src/shared/errors/app-error.ts` (verificado contra el código, no aspiracional):

```typescript
// Jerarquía de errores personalizados
AppError (base)
├── ValidationError      (400)  // Input inválido o regla de negocio violada
├── AuthenticationError  (401)  // No autenticado o token expirado
├── AuthorizationError   (403)  // Sin permisos para esta acción
├── NotFoundError        (404)  // Recurso no existe
├── ConflictError        (409)  // Email duplicado, etc.
├── PayloadTooLargeError (413)  // Archivo supera el máximo permitido
└── AccountLockedError   (429)  // Cuenta bloqueada por intentos fallidos —
                                 // 429 y no 401: no es un problema de
                                 // credenciales, es un límite temporal
```

Dos códigos de error **no** pasan por esta jerarquía de clases — se manejan en un punto distinto del pipeline de middleware, y por eso no son subclases de `AppError`:
- **429 por rate limiting** (`express-rate-limit`) — se resuelve en el propio middleware, antes de llegar al controller/service; nunca hay una excepción de dominio que capturar.
- **500 inesperado** — es el fallback genérico del `errorHandler` para cualquier `Error` que no sea `AppError` (bug no anticipado). No existe una clase `InternalError` explícita porque, por definición, estos son los errores que el código *no* supo clasificar.
```


---

### 3.2 Panel de Administración — React

#### Arquitectura del frontend admin

```
admin/src/
├── components/          # Componentes UI reutilizables
│   ├── ui/              # Primitivos (Button, Input, Modal, Table)
│   ├── layout/          # Shell, Sidebar, Header
│   └── forms/           # Formularios específicos
├── pages/               # Páginas (1 archivo = 1 ruta)
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ReadingsPage.tsx
│   ├── ReadingEditorPage.tsx
│   ├── QuestionsPage.tsx
│   └── UsersPage.tsx
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useReadings.ts   # TanStack Query hooks
│   └── useQuestions.ts
├── services/            # API client (fetch wrapper)
│   └── api.ts           # Instancia base con interceptors
├── stores/              # Zustand stores
│   ├── authStore.ts
│   └── uiStore.ts       # Sidebar, theme, toasts
├── types/               # TypeScript types
└── utils/               # Helpers
```

#### Patrones clave
- **Data fetching**: TanStack Query para cache, revalidación y estados de carga
- **Estado global**: Zustand solo para estado UI (sidebar, theme) y auth
- **Estado del servidor**: TanStack Query maneja todo el estado que viene de la API
- **Formularios**: React Hook Form + Zod (mismos schemas que el backend cuando sea posible)

---

### 3.3 App Móvil — Flutter

#### Arquitectura: Clean Architecture adaptada

```
mobile/lib/
├── core/                    # Fundaciones
│   ├── config/              # Environment, API URLs
│   ├── theme/               # Colores, tipografía, espaciado
│   ├── constants/           # Constantes de la app
│   ├── errors/              # Excepciones y failures
│   └── network/             # Dio client, interceptors
│
├── data/                    # Capa de datos
│   ├── datasources/         # Remote (API) y Local (SharedPrefs/SQLite)
│   ├── models/              # Modelos JSON (fromJson/toJson)
│   └── repositories/        # Implementación de los repos
│
├── domain/                  # Capa de dominio (pura Dart, sin dependencias)
│   ├── entities/            # Entidades de negocio
│   ├── repositories/        # Contratos (interfaces abstractas)
│   └── usecases/            # Casos de uso
│
├── presentation/            # Capa de presentación
│   ├── screens/             # Pantallas completas
│   ├── widgets/             # Widgets reutilizables
│   ├── providers/           # Riverpod providers
│   └── routes/              # GoRouter configuration
│
└── main.dart                # Entry point
```

#### Patrones clave
- **Estado**: Riverpod (providers tipados, auto-dispose)
- **Navegación**: GoRouter (declarativa, deep linking ready)
- **HTTP**: Dio con interceptors para auth (auto-refresh de JWT)
- **Offline**: Caché local de lecturas ya descargadas (SharedPreferences + SQLite)
- **Imágenes**: CachedNetworkImage (caché automático)

---

## 4. Flujo de Datos

### 4.1 Flujo: Admin publica una lectura

`POST /api/readings` **no** acepta un array de preguntas — el schema real (`reading.validator.ts`) solo toma título/contenido/niveles/portada. Las preguntas se crean en llamadas separadas contra `/api/readings/:readingId/questions`, porque `publish` valida un invariante independiente (≥5 `APPROVED`) que no tiene sentido intentar cumplir dentro del mismo POST que crea la lectura vacía.

```
Admin (React)                  API (Express)              BD (PostgreSQL)
     │                              │                           │
     │  1) Crear la lectura (status: DRAFT)                     │
     ├── POST /api/readings ──────► │                           │
     │   { title, content,          ├── Validate (Zod) ──────► │
     │     comprehensionLevel,      ├── readingService         │
     │     progressionLevel }       │   .create() ────────────► │
     │                              │                    INSERT INTO readings
     │ ◄── { success, data } ──────┤ ◄─────────────── reading object
     │                              │                           │
     │  (si tiene portada)          │                           │
     ├── POST /api/media/upload ───►├── Guardar en disco ─────► Filesystem local
     │ ◄── { url } ─────────────────┤   (🔲 GCS en Fase 2+)     │
     ├── PUT /api/readings/:id ────►│   coverImageUrl = url ──► │
     │                              │                           │
     │  2) Agregar preguntas (repetido ≥5 veces, una por pregunta)
     ├── POST /api/readings/:id/               │                │
     │       questions ────────────►│── questionService        │
     │   { statement, options,      │   .create() ────────────► │
     │     correctAnswer, type }    │              INSERT INTO questions
     │                              │              status: APPROVED (creada
     │ ◄── { success, data } ──────┤              manualmente = ya revisada)
     │                              │                           │
     │  3) Publicar — el backend, no el admin, valida el mínimo │
     ├── PATCH /api/readings/:id/            │                  │
     │       publish ──────────────►│── readingService         │
     │                              │   .publish() ────────────► │
     │                              │      COUNT questions WHERE │
     │                              │      status = APPROVED     │
     │                              │      (< 5 → 400, aborta)   │
     │ ◄── { status: PUBLISHED } ──┤                            │
```

### 4.2 Flujo: Estudiante completa un reto

No hay caché — `GET /api/readings/:id` pega directo a Postgres en Fase 1. Redis para cachear lecturas (inmutables una vez publicadas) es una optimización de Fase 2 (ver sección 7), no algo que exista hoy.

```
Estudiante (Flutter, 🔲 no iniciado)   API (Express) ✅          PostgreSQL
     │                                     │                          │
     ├── GET /api/readings/:id ──────────► │                          │
     │                                     ├── readingService         │
     │                                     │   .findById() ─────────► │
     │ ◄── { reading + questions } ────────┤                          │
     │     (solo status APPROVED,          │                          │
     │      sin correctAnswer)             │                          │
     │                                     │                          │
     │   [Estudiante lee y                 │                          │
     │    responde TODAS las preguntas     │                          │
     │    aprobadas — no puede saltar]     │                          │
     │                                     │                          │
     ├── POST /api/progress/submit ──────► │                          │
     │   { readingId, answers[],           ├── progressService        │
     │     timeSpentSec }                  │   .submit() ────────────► │
     │                                     │            INSERT INTO quiz_attempts
     │                                     │            UPSERT student_progress
     │                                     │            (bestScore, attempts,
     │                                     │             completed, completedAt)
     │                                     │            si es la 1ra vez que
     │                                     │            aprueba: +100 puntos
     │                                     │            y checkLevelUp() —
     │                                     │            ¿completó TODAS las
     │                                     │            lecturas publicadas
     │                                     │            de su nivel actual?
     │ ◄── { attempt, progress,            │                          │
     │       rewards: { pointsEarned,      │                          │
     │       levelUp, newLevel } } ────────┤                          │
```

### 4.3 Flujo: Generación de preguntas con IA (Fase 2 — diseño, no implementado)

El request HTTP **no espera** a Gemini — ADR-008 decide explícitamente encolar el trabajo (BullMQ) porque la generación puede tardar 5–15s. El endpoint devuelve `202 Accepted` con un `jobId` de inmediato; el resultado se persiste directo en la base de datos con `status: DRAFT`, no se retorna en la respuesta del job. Contrato completo en `docs/api-reference.md` sección 9.

```
Admin (React)              API (Express)          Cola (BullMQ)      Gemini API        Postgres
     │                          │                       │                 │                │
     ├── POST /api/ai/     ───► │                       │                 │                │
     │   generate               │                       │                 │                │
     │   { readingId, level,    ├── Encolar job ───────►│                 │                │
     │     numberOfQuestions }  │                       │                 │                │
     │ ◄── 202 { jobId,     ────┤  (el HTTP request termina AQUÍ — no bloquea)              │
     │      status: PROCESSING }│                       │                 │                │
     │                          │                       │                 │                │
     │                          │                       ├── Leer texto ──────────────────► │
     │                          │                       │ ◄──────────────────────────────── │
     │                          │                       ├── Prompt ──────►│                │
     │                          │                       │ ◄── questions[]─┤                │
     │                          │                       ├── INSERT Question ──────────────► │
     │                          │                       │   isAiGenerated: true,            │
     │                          │                       │   status: DRAFT (sin revisar)     │
     │                          │                       │                 │                │
     │  [Admin hace polling]    │                       │                 │                │
     ├── GET /api/ai/       ───►│                       │                 │                │
     │   jobs/:jobId             ├── Consultar estado ──►│                 │                │
     │ ◄── { status:        ────┤ ◄─────────────────────┤                 │                │
     │      COMPLETED,          │                       │                 │                │
     │      createdQuestionIds }│                       │                 │                │
     │                          │                       │                 │                │
     │  [Admin revisa cada una] │                       │                 │                │
     ├── GET .../questions?  ──►│                       │                 │                │
     │      status=DRAFT         │                       │                 │                │
     ├── PATCH .../questions/   │                       │                 │                │
     │   :id/approve ──────────►│── status: APPROVED ──────────────────────────────────────► │
     │                          │                       │                 │                │
     │  Solo entonces esta pregunta cuenta para el mínimo de 5 que exige PATCH .../publish  │
```

---

## 5. Decisiones Arquitectónicas (ADR)

### ADR-001: Monolito modular vs. Microservicios
- **Decisión:** Monolito modular
- **Razón:** Equipo pequeño (1-2 devs), lanzamiento rápido, sin necesidad de escalar componentes independientemente en Fase 1
- **Migración futura:** Los módulos están desacoplados — se pueden extraer a microservicios si la escala lo requiere

### ADR-002: PostgreSQL vs. MongoDB
- **Decisión:** PostgreSQL
- **Razón:** Datos fuertemente relacionales (lecturas → preguntas → intentos → progreso). Las relaciones son el corazón del modelo de datos

### ADR-003: JWT vs. Sessions
- **Decisión:** JWT con refresh token rotation
- **Razón:** App móvil stateless. No queremos depender de cookies. El refresh rotation previene token theft

### ADR-004: Flutter vs. React Native
- **Decisión:** Flutter
- **Razón:** Mejor rendimiento en gama baja (compila a código nativo ARM), single codebase para futuro iOS, widget system más predecible

### ADR-005: Prisma vs. TypeORM vs. Knex
- **Decisión:** Prisma
- **Razón:** Type safety superior (genera tipos desde el schema), migraciones declarativas, Prisma Studio para debugging visual

### ADR-006: REST vs. GraphQL
- **Decisión:** REST
- **Razón:** Más simple para el equipo, endpoints predecibles, mejor caching HTTP. GraphQL es over-engineering para este volumen de entidades

### ADR-007: Almacenamiento de imágenes
- **Decisión:** Google Cloud Storage (o S3-compatible)
- **Razón:** Las imágenes de lecturas y avatares no deben vivir en la BD. CDN para servir assets rápido
- **Addenda:** `POST /api/media/upload` se implementó primero contra un provider de disco local (`LocalDiskStorageProvider`) como implementación interina, detrás de la interfaz `StorageProvider` (`src/shared/storage/storage-provider.ts`). GCS es enchufable a futuro implementando esa misma interfaz sin tocar `MediaController` ni `MediaService` — ambos son agnósticos al mecanismo de almacenamiento.

### ADR-008: Cola de generación de IA
- **Decisión:** BullMQ (Redis-based job queue)
- **Razón:** La generación con Gemini puede tardar 5-15 segundos. No bloquear el request HTTP. El admin recibe un job ID y consulta el estado

### ADR-009: Redis diferido a Fase 2
- **Decisión:** No instalar Redis en Fase 1, aunque `TECHSTACK.md` ya lo liste como dependencia planeada
- **Razón:** Fase 1 no tiene ningún caso de uso que lo necesite — no hay cola de jobs (IA es Fase 2) ni caché de lecturas (el volumen de Fase 1, hasta 5.000 usuarios concurrentes, no lo justifica; ver sección 11, Dimensionamiento). Agregar infraestructura sin un consumidor real es complejidad prematura
- **Disparador para revisar esta decisión:** el día que se implemente `ai` (ADR-008, necesita la cola) o que el NFR de latencia (p95 < 500ms, ver sección 10) deje de cumplirse por carga de lectura repetida de las mismas lecturas publicadas

---

## 6. Seguridad

### 6.1 Autenticación y Autorización

```
┌───────────────────────────────────────────┐
│              JWT Architecture             │
│                                           │
│  Access Token (15 min)                    │
│  ├── userId                               │
│  ├── role (STUDENT | ADMIN)               │
│  └── exp                                  │
│                                           │
│  Refresh Token (7 días)                   │
│  ├── userId                               │
│  ├── tokenFamily (para rotation)          │
│  └── exp                                  │
│                                           │
│  Rotation: cada uso del refresh token     │
│  invalida el anterior y genera uno nuevo  │
└───────────────────────────────────────────┘
```

### 6.2 Autorización por roles

Tabla verificada línea por línea contra `docs/api-reference.md` y las rutas reales (`*.routes.ts`) — no contra lo que "debería" existir.

| Recurso | STUDENT | ADMIN |
|---------|---------|-------|
| `GET /readings` | ✅ (solo `PUBLISHED`) | ✅ (todas, filtro `status` opcional) |
| `GET /readings/:id` | ✅ (solo si `PUBLISHED`, sin `correctAnswer`) | ✅ (cualquier estado, con `correctAnswer`) |
| `POST /readings` · `PUT /readings/:id` | ❌ | ✅ |
| `PATCH /readings/:id/publish` · `/archive` | ❌ | ✅ |
| `DELETE /readings/:id` | ❌ | ✅ |
| `GET /readings/:id/questions` | ✅ (solo `APPROVED`) | ✅ (todas, filtro `status`) |
| `POST/PUT/DELETE .../questions` · `.../approve` | ❌ | ✅ |
| `POST /progress/submit` | ✅ | ❌ |
| `GET /progress/me` · `/progress/reading/:id` | ✅ (propio) | ❌ (no hay vista "todos los estudiantes" implementada) |
| `GET /users/me` · `PUT /users/me` | ✅ (propio) | ✅ (propio) |
| `GET /users` | ❌ | ✅ |
| `POST /media/upload` | ✅ (solo `type: avatar`) | ✅ (`reading-cover` y `avatar`) |
| `GET /stats/dashboard` | ❌ | ✅ |
| `POST /ai/generate` · `GET /ai/jobs/:id` (🔲 Fase 2) | ❌ | ✅ |

### 6.3 Protecciones

- **Rate limiting**: 100 req/min por IP (general), 10 req/min para login, 5 req/min para registro, 20 req/min para upload de media — límites definidos en `middleware/rate-limiter.middleware.ts`
- **CORS**: origin único configurable vía `ADMIN_CORS_ORIGIN` (hoy `http://localhost:5173`; en producción, el dominio real del panel admin)
- **Helmet**: headers de seguridad HTTP por defecto
- **Validación de input**: Zod en el borde de cada endpoint (forma, tipos, longitudes, enums) — **no** incluye sanitización/escape de HTML del contenido de lecturas. Es un gap real, no una protección ya implementada; está en el registro de riesgos (sección 12, R-04)
- **Upload de imágenes**: el tipo de archivo se valida por **magic bytes** del buffer, no por `Content-Type` ni extensión declarados por el cliente — evita subir un ejecutable disfrazado de `.png`
- **SQL injection**: Prisma usa queries parametrizadas por defecto; el proyecto no usa `$queryRawUnsafe` en ningún módulo
- **Data privacy de menores**: el modelo de datos solo captura nombre, email y grado escolar — sin geolocalización ni otros datos sensibles. **Esto es una postura de diseño razonable, no una certificación de cumplimiento MINEDUC** — los lineamientos reales siguen sin consultarse (ver `TASKS.md` → Bloqueados)

---

## 7. Escalabilidad

### Fase 1 (hasta 5,000 usuarios)
- Servidor único (Railway/Render)
- PostgreSQL managed (Supabase/Neon)
- Sin Redis todavía (ADR-009) — nada en Fase 1 lo necesita
- Suficiente para el lanzamiento nacional piloto — ver dimensionamiento en sección 11

### Fase 2 (hasta 50,000 usuarios)
- Horizontal scaling del API server (2-3 instancias detrás de load balancer)
- Connection pooling (PgBouncer)
- Redis cache agresivo para lecturas (son inmutables una vez publicadas)
- CDN para assets estáticos (imágenes, avatares)

### Fase 3 (100,000+ usuarios)
- Evaluar migración a Kubernetes
- Read replicas de PostgreSQL
- Leaderboard en Redis Sorted Sets (O(log n) para ranking)
- Job queue dedicado para generación de IA

---

## 8. Monitoreo y Observabilidad

| Capa | Herramienta | Qué monitorea | Estado |
|------|------------|---------------|:---:|
| **API** | Morgan + Winston | Logs estructurados de cada request y error | ✅ Implementado (`config/logger.ts`, `app.ts`) |
| **API** | `GET /health` | Liveness check | ✅ Implementado — usado en la verificación manual antes de cada demo |
| **Errores** | Sentry | Error tracking con contexto | 🔲 Planeado, no instalado |
| **Performance** | Sentry Performance | Latencia de endpoints | 🔲 Planeado |
| **App móvil** | Firebase Crashlytics | Crashes y ANRs | 🔲 Planeado (mobile ni siquiera existe todavía) |
| **Analytics** | Firebase Analytics | Engagement, retención | 🔲 Planeado |
| **Uptime** | UptimeRobot / BetterUptime | Alertas de caída | 🔲 Planeado — requiere una URL pública desplegada, todavía no hay hosting definido |
| **BD** | Prisma Metrics / `pg_stat_statements` | Queries lentas | 🔲 Planeado |

**Qué existe hoy realmente:** logs a stdout (Winston, JSON en producción / coloreado en desarrollo) y un endpoint de salud. Todo lo demás depende de tener un entorno desplegado — ver sección 13 (Topología de Despliegue), que a su vez depende de que el cliente confirme dónde hospedar (bloqueado en `TASKS.md`).

---

## 9. Estrategia de Versionado de API

Hoy todos los endpoints viven bajo `/api/*` sin prefijo de versión — en la práctica eso **es** "v1" implícito. La estrategia, antes de que exista un motivo real para romperla:

**Regla general: preferir cambios aditivos y no versionar por default.**
- Agregar un endpoint nuevo, un campo opcional nuevo en la respuesta, o un query param opcional nuevo → **no** requiere versión nueva. Los clientes (admin, mobile) ya deben ignorar campos desconocidos.
- Estos SÍ son cambios rompientes y disparan una versión nueva: quitar o renombrar un campo de una respuesta, cambiar el significado de un código de estado HTTP ya usado, endurecer una validación de forma que un request antes válido ahora falle, cambiar qué rol puede llamar un endpoint.

**Mecanismo cuando sí hace falta romper algo:** versionado por path (`/api/v2/readings`), no por header — es más simple de debuggear con `curl`/Postman y más explícito en los logs. La versión anterior (`/api/*` = v1) sigue viva en paralelo durante una ventana de deprecación; no hay "big bang cutover".

**Por qué esto importa más de lo normal para LectoApp específicamente:** el panel admin (SPA) se puede forzar a recargar la última versión en cualquier momento — no hay problema de compatibilidad ahí. La **app móvil sí es distinta**: un estudiante con Android 8 y conectividad irregular puede tardar semanas en actualizar. Una vez que Sprint 4 (mobile) exista, cualquier cambio rompiente en un endpoint que la app ya usa en producción (`auth`, `readings`, `progress`) necesita la ventana de deprecación real, no solo en el papel — este es precisamente el escenario que la regla de "preferir aditivo" busca evitar tener que enfrentar seguido.

**Ejemplo concreto ya vivido en este proyecto** (ver `TASKS.md`): agregar `status: QuestionStatus` a `Question` fue un cambio de schema, pero como el campo es nuevo y `docs/api-reference.md` ya lo documentó desde el principio del flujo de preguntas, **no** fue un cambio rompiente — ningún cliente existente dependía de su ausencia.

---

## 10. Trazabilidad de Requerimientos No Funcionales

Cada NFR de `PRD.md` sección 6, mapeado a la decisión arquitectónica que lo satisface (o al hueco que todavía lo deja sin cubrir).

| NFR (PRD.md) | Métrica objetivo | Decisión arquitectónica | Estado |
|---|---|---|---|
| Tiempo de carga de lectura | < 2s en 3G | Imágenes servidas desde disco local hoy / GCS+CDN en Fase 2 (ADR-007); caché offline SQLite en mobile (sección 3.3) | 🔲 No medido — no hay build de mobile ni CDN todavía |
| Tiempo de respuesta API | < 500ms p95 | Índices Prisma en columnas de filtro/orden frecuente (`docs/data-model.md`); JWT stateless evita lookup de sesión en cada request | 🔲 No medido con carga real — sí verificado que responde correctamente, no que cumple el p95 bajo carga |
| Uptime | 99.5% mensual | Hosting managed con auto-restart (Railway/Render, sección 13); `GET /health` para que el orquestador detecte caídas | 🔲 No aplicable todavía — no hay ambiente desplegado que medir |
| Usuarios concurrentes Fase 1 | Hasta 5.000 | Servidor stateless → escalable horizontalmente sin sticky sessions; ver dimensionamiento sección 11 | ✅ El diseño lo soporta; 🔲 sin prueba de carga real |
| Usuarios totales año 1 | Hasta 50.000 | Plan de escalamiento por fases (sección 7): connection pooling, cache, read replicas según haga falta | 🔲 Planeado, no necesario todavía (0 usuarios reales) |
| Android mínimo / RAM | Android 8.0 (API 26) / 2GB | Flutter compila a ARM nativo (ADR-004); `ListView.builder` obligatorio (`CLAUDE.md`) | 🔲 Mobile no iniciado — el requisito está documentado, no verificado |
| Tamaño de APK | < 30MB | Sin librerías pesadas prohibidas (`TECHSTACK.md`); imágenes optimizadas del lado del servidor | 🔲 No aplicable — no existe APK todavía |
| Offline | Lectura disponible sin conexión | Caché local (SQLite) de lecturas descargadas (sección 3.3) | 🔲 Diseñado, no implementado |
| Privacidad de datos de menores | Cumplir MINEDUC | Modelo de datos minimalista (solo nombre/email/grado) — ver sección 6.3 | ⚠️ Postura razonable, **no** confirmación de cumplimiento real — lineamientos MINEDUC bloqueados en `TASKS.md` |
| Idioma de interfaz | Español (Guatemala) | Mensajes de error del backend en español (`CONVENTIONS.md`, verificado en el código real: `AppError` y sus subclases) | ✅ Implementado y verificado en el backend; 🔲 admin/mobile UI copy no auditado línea por línea |

**Lectura honesta de esta tabla:** la mayoría de los NFRs de performance/escala/disponibilidad están "diseñados para" pero no "medidos" — no hay carga real todavía porque no hay usuarios reales todavía. Eso es correcto para esta etapa del proyecto, pero un Solutions Architect no debe reportar un NFR como cumplido solo porque el diseño apunta en esa dirección.

---

## 11. Dimensionamiento de Capacidad

Orden de magnitud para conversar con el cliente sobre infraestructura — **no reemplaza el expediente de propuesta financiera** (`TASKS.md` ya lo tiene como entregable aparte, con fecha de entrega propia).

| Fase | Usuarios | Carga estimada | Sizing sugerido |
|---|---|---|---|
| **Fase 1 — piloto** | Hasta 5.000 concurrentes | Con un uso típico educativo (sesiones cortas, picos en horario de clases, no 5.000 simultáneos reales todo el tiempo), esto es tráfico bajo-medio para una API REST stateless | 1 instancia de API (512MB–1GB RAM, 1 vCPU compartido) + Postgres managed en su tier de entrada (Neon/Supabase free o starter). El cuello de botella más probable es el tier gratuito de Gemini (60 RPM, ya documentado como bloqueado), no el servidor |
| **Fase 2 — 50k usuarios/año 1** | Uso disperso en el tiempo, no 50k concurrentes | 2–3 instancias de API detrás de load balancer (el diseño stateless lo permite sin cambios de código); PgBouncer para pooling de conexiones; Redis (ADR-009 se activa aquí) | Este es el punto donde vale la pena revisar si el tier gratuito/starter de la BD managed sigue alcanzando, según el volumen real observado en Fase 1 |
| **Fase 3 — 100k+** | Requiere datos reales de Fase 2 para dimensionar en serio | Read replicas de Postgres, leaderboard en Redis Sorted Sets, cola de IA dedicada | No dimensionar en el vacío — usar métricas reales de `GET /api/stats/dashboard` (ya implementado) como input |

**Supuesto explícito:** estos números asumen el patrón de uso típico de una app educativa (uso concentrado en horario escolar, sesiones de minutos, no de horas). Si el cliente confirma un patrón distinto (ej. uso nocturno masivo simultáneo por examen nacional programado), este dimensionamiento hay que revisarlo.

---

## 12. Registro de Riesgos Arquitectónicos

Riesgos de arquitectura/infraestructura — distintos de los riesgos de producto que ya están en `PRD.md` sección 10.

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|:---:|:---:|------------|
| R-01 | Vendor lock-in (Railway/Neon/Upstash/GCS son todos reemplazables pero no gratis de migrar) | Media | Medio | Prisma abstrae el motor de BD; `StorageProvider` ya desacopla el almacenamiento de imágenes (ADR-007) — el patrón está probado, falta replicarlo si se agregan más dependencias externas |
| R-02 | Rate limit de Gemini API (60 RPM tier gratuito) bloquea la generación de preguntas en Fase 2 | Alta | Medio | Cola con reintentos (BullMQ, ADR-008) + fallback manual ya aceptado por el cliente (`IDEA.md` sección 2.3) |
| R-03 | Monolito modular = punto único de falla en runtime (no en el código — los módulos sí están desacoplados) | Baja | Alto | Hosting managed con auto-restart; los límites de módulo ya respetados (sección 3.1, revisados por el agente `arquitecto`) hacen que extraer un módulo a servicio aparte sea un refactor, no una reescritura, si algún día hace falta |
| R-04 | Sin sanitización de HTML en el contenido de lecturas — XSS almacenado si una cuenta ADMIN se compromete o si el registro de admins se abre a terceros | Baja hoy (solo el admin sembrado tiene esa cuenta), sube si se abre registro institucional | Medio-Alto si se abre registro de admins | Agregar sanitización (ej. `sanitize-html`) antes de permitir que instituciones externas registren sus propias cuentas admin — no es urgente con un solo admin de confianza, sí antes de escalar ese modelo |
| R-05 | Entorno de desarrollo corre Node 24, `TECHSTACK.md` exige 20.x LTS | Media | Bajo | Alinear la versión antes de definir la imagen de producción; el código no usa ninguna API específica de Node 24, así que el downgrade no debería romper nada |
| R-06 | Hosting/presupuesto sin confirmar por el cliente | Alta (ya está bloqueado) | Alto — bloquea todo lo de la sección 13 | Ya registrado en `TASKS.md` → Bloqueados; requiere decisión del cliente, no es un problema técnico |
| R-07 | Bundle de producción del admin supera 500KB (Recharts es el grueso) | Cierta (ya ocurrió, ver build) | Bajo (admin es interno, no afecta al estudiante en 3G) | Code-splitting con `import()` dinámico si el panel admin llega a usarse desde conexiones lentas; hoy es un warning de build, no un incidente |
| R-08 | Lineamientos de privacidad MINEDUC no consultados | Alta (nadie los ha revisado todavía) | Alto — riesgo legal/reputacional, no solo técnico | Ya bloqueado en `TASKS.md`; el diseño actual (sección 6.3) es conservador por defecto, pero no sustituye la validación legal real |

---

## 13. Topología de Despliegue

**Esto es una recomendación, no una decisión tomada** — `TASKS.md` tiene "Definir hosting y presupuesto operativo" como bloqueado, pendiente del cliente. Se documenta aquí para que la conversación con el cliente parta de una propuesta concreta en vez de una hoja en blanco, usando las opciones ya listadas en `TECHSTACK.md` → Infraestructura.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet                                │
└────────────┬─────────────────────────────┬──────────────────────┘
             │                             │
             ▼                             ▼
   ┌───────────────────┐         ┌──────────────────────┐
   │  Panel Admin       │         │  App Móvil            │
   │  (estático, build  │         │  (APK vía Play Store, │
   │  de Vite)          │         │   🔲 Fase 2)          │
   │  Railway/Render/    │         └──────────────────────┘
   │  Vercel — a definir │
   └──────────┬─────────┘
              │ HTTPS /api/*
              ▼
   ┌─────────────────────────────┐
   │  API (Node/Express)          │
   │  1 instancia — Railway/Render│
   │  Fase 1                      │
   └──────┬────────────┬──────────┘
          │            │
          ▼            ▼
┌──────────────────┐ ┌──────────────────────┐
│ PostgreSQL         │ │ Almacenamiento de     │
│ managed             │ │ imágenes               │
│ Neon / Supabase     │ │ Fase 1: disco local del│
│                     │ │ mismo servidor (⚠️ se  │
│                     │ │ pierde en cada redeploy│
│                     │ │ — ver nota abajo)      │
│                     │ │ Fase 2: GCS (ADR-007)  │
└──────────────────────┘ └──────────────────────┘
```

**Advertencia operativa real, no cosmética:** `LocalDiskStorageProvider` guarda archivos en el filesystem del contenedor. La mayoría de PaaS (Railway/Render en su tier estándar) tienen **filesystem efímero** — un redeploy borra `backend/uploads/`. Esto es aceptable para desarrollo local (donde se verificó) pero **no** para el primer ambiente desplegado con imágenes reales de lecturas: activar GCS (o montar un volumen persistente) es un prerrequisito de la primera demo con el cliente que involucre portadas de lectura, no una mejora de "Fase 2" que se pueda posponer indefinidamente una vez que haya un ambiente real.

**Checklist antes de desplegar el primer ambiente real** (para no descubrir esto en producción):
1. Confirmar con el cliente: ¿Railway, Render, o VPS propio? (bloqueado, ver `TASKS.md`)
2. Si el hosting elegido no da filesystem persistente → activar `GcsStorageProvider` antes del primer deploy con imágenes reales, no después
3. `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` reales (nunca los de `.env` de desarrollo) como variables de entorno del hosting, no committeados
4. `ADMIN_CORS_ORIGIN` apuntando al dominio real del panel admin desplegado, no a `localhost:5173`

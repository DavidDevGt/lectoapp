# ARCHITECTURE.md — LectoApp

**Documento:** Arquitectura del Sistema  
**Versión:** 1.0  
**Rol:** Software Solutions Architect  
**Fecha:** Agosto 2026

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
│  └──────────┬──────────┘     └──────────┬──────────────┘    │
│             │                            │                   │
└─────────────┼────────────────────────────┼───────────────────┘
              │         HTTPS              │
              ▼                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     API REST (Node.js/Express)               │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │   Auth   │ │ Content  │ │ Progress │ │     AI       │   │
│  │  Module  │ │  Module  │ │  Module  │ │   Module     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Middleware Layer                            │   │
│  │  (Auth, Validation, Error Handling, Rate Limiting)    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────┘
                           │
              ┌────────────┼────────────────┐
              ▼            ▼                ▼
       ┌───────────┐ ┌──────────┐  ┌──────────────┐
       │ PostgreSQL │ │  Redis   │  │ Google Cloud │
       │  (Prisma)  │ │ (Cache)  │  │ Storage      │
       └───────────┘ └──────────┘  │ (Imágenes)   │
                                    └──────────────┘
                                           │
                                    ┌──────────────┐
                                    │  Gemini API  │
                                    │  (Gen. de    │
                                    │  preguntas)  │
                                    └──────────────┘
```

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

```typescript
// Jerarquía de errores personalizados
AppError (base)
├── ValidationError      (400)  // Input inválido o regla de negocio violada
├── AuthenticationError  (401)  // No autenticado o token expirado
├── AccountLockedError   (401)  // Cuenta bloqueada por intentos fallidos
├── AuthorizationError   (403)  // Sin permisos para esta acción
├── NotFoundError        (404)  // Recurso no existe
├── ConflictError        (409)  // Email duplicado, etc.
├── PayloadTooLargeError (413)  // Archivo supera el máximo permitido
├── RateLimitError       (429)  // Demasiadas peticiones
└── InternalError        (500)  // Error inesperado (loguear, no exponer)
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

```
Admin (React)                  API (Express)              BD (PostgreSQL)
     │                              │                           │
     ├── POST /api/readings ──────► │                           │
     │   { title, content,          ├── Validate (Zod) ──────► │
     │     level, questions[] }     ├── readingService         │
     │                              │   .create() ────────────► │
     │                              │                    INSERT INTO readings
     │                              │                    INSERT INTO questions
     │                              │ ◄─────────────── reading object
     │ ◄── { success, data } ──────┤                           │
     │                              │                           │
     │  (si tiene imagen)           │                           │
     ├── POST /api/media/upload ───►├── Upload (disco local) ─► Filesystem local
     │                              │                           │
```

### 4.2 Flujo: Estudiante completa un reto

```
Estudiante (Flutter)            API (Express)              BD + Redis
     │                              │                           │
     ├── GET /api/readings/:id ───► │                           │
     │                              ├── Check Redis cache       │
     │                              ├── readingService          │
     │                              │   .findById() ──────────► │
     │ ◄── { reading + questions }  │                           │
     │                              │                           │
     │   [Estudiante lee y          │                           │
     │    responde preguntas]       │                           │
     │                              │                           │
     ├── POST /api/progress ──────► │                           │
     │   { readingId, answers[],    ├── progressService         │
     │     score, timeSpent }       │   .submitAttempt() ─────► │
     │                              │                    INSERT INTO attempts
     │                              │   .updateProgress() ────► │
     │                              │                    UPDATE student_progress
     │                              │   .checkLevelUp() ──────► │
     │                              │                    CHECK all readings done
     │ ◄── { result, newLevel?,     │                           │
     │       pointsEarned }         │                           │
```

### 4.3 Flujo: Generación de preguntas con IA (Fase 2)

```
Admin (React)                  API (Express)         Gemini API       BD
     │                              │                     │            │
     ├── POST /api/ai/generate ───► │                     │            │
     │   { readingId, level }       │                     │            │
     │                              ├── Get reading text  │            │
     │                              │   from BD ─────────────────────► │
     │                              │ ◄─────────────────────────────── │
     │                              │                     │            │
     │                              ├── Build prompt ────►│            │
     │                              │   (texto + nivel +  │            │
     │                              │    instrucciones)   │            │
     │                              │                     │            │
     │                              │ ◄── questions[] ────┤            │
     │                              │                     │            │
     │                              ├── Save as draft ──────────────► │
     │                              │                          INSERT  │
     │ ◄── { questions (draft) } ──┤                                  │
     │                              │                                  │
     │  [Admin revisa/edita]        │                                  │
     ├── PUT /api/questions/:id ──► │                                  │
     │   { approved: true }         ├── Publish ──────────────────► │  │
     │                              │                         UPDATE   │
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

| Recurso | STUDENT | ADMIN |
|---------|---------|-------|
| `GET /readings` | ✅ (publicadas) | ✅ (todas) |
| `POST /readings` | ❌ | ✅ |
| `PUT /readings/:id` | ❌ | ✅ |
| `DELETE /readings/:id` | ❌ | ✅ |
| `GET /progress` | ✅ (propio) | ✅ (todos) |
| `POST /progress` | ✅ | ❌ |
| `GET /users` | ❌ | ✅ |
| `POST /ai/generate` | ❌ | ✅ |

### 6.3 Protecciones

- **Rate limiting**: 100 req/min por IP (general), 10 req/min para login
- **CORS**: Solo origins autorizados (admin domain, app mobile)
- **Helmet**: Headers de seguridad HTTP
- **Input sanitization**: Zod + escape de HTML en contenido de lecturas
- **SQL injection**: Prisma usa queries parametrizadas por defecto
- **Data privacy**: Datos de menores — solo nombre, email, grado. Sin geolocalización ni datos personales sensibles

---

## 7. Escalabilidad

### Fase 1 (hasta 5,000 usuarios)
- Servidor único (Railway/Render)
- PostgreSQL managed (Supabase/Neon)
- Redis managed (Upstash)
- Suficiente para el lanzamiento nacional piloto

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

| Capa | Herramienta | Qué monitorea |
|------|------------|---------------|
| **API** | Morgan + Winston | Logs estructurados (request, errors) |
| **Errores** | Sentry | Error tracking con context |
| **Performance** | Sentry Performance | Latencia de endpoints |
| **App móvil** | Firebase Crashlytics | Crashes y ANRs |
| **Analytics** | Firebase Analytics | Engagement, retención |
| **Uptime** | UptimeRobot / BetterUptime | Alertas de caída |
| **BD** | Prisma Metrics / pg_stat | Queries lentas |

# TECHSTACK.md — LectoApp

**Documento:** Stack Tecnológico y Versiones  
**Versión:** 1.0  
**Fecha:** Agosto 2026

> Este archivo es la fuente de verdad sobre qué tecnologías usar.
> Si un agente de IA sugiere una librería que no está aquí, NO la uses sin aprobación.

---

## Runtime y Lenguajes

| Tecnología | Versión | Notas |
|-----------|---------|-------|
| **Node.js** | 20.x LTS | NO usar versiones impares (21, 23) |
| **TypeScript** | 5.x | `strict: true` obligatorio |
| **Dart** | 3.x | Viene con Flutter SDK |
| **Flutter** | 3.x stable | Canal stable, NO beta ni dev |

---

## Backend — API REST

### Framework y Core

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `express` | ^4.21 | Framework web |
| `cors` | ^2.8 | Cross-Origin Resource Sharing |
| `helmet` | ^8.0 | Headers de seguridad HTTP |
| `morgan` | ^1.10 | HTTP request logging |
| `compression` | ^1.7 | Compresión gzip de responses |
| `express-rate-limit` | ^7.0 | Rate limiting por IP |
| `dotenv` | ^16.0 | Variables de entorno |

### Base de Datos y ORM

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `prisma` | ^5.0 | ORM + migraciones (devDependency) |
| `@prisma/client` | ^5.0 | Client generado para queries tipadas |
| `ioredis` | ^5.0 | Cliente Redis para cache y jobs |

### Autenticación

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `jsonwebtoken` | ^9.0 | Generación y verificación de JWT |
| `bcryptjs` | ^2.4 | Hashing de contraseñas (salt rounds: 12) |

### Validación

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `zod` | ^3.23 | Schema validation (inputs de API) |

### Logging

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `winston` | ^3.0 | Logger estructurado |

### IA y Jobs

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@google/generative-ai` | ^0.21 | Google Gemini API client |
| `bullmq` | ^5.0 | Job queue para generación async de preguntas |

### Archivos y Storage

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `@google-cloud/storage` | ^7.0 | Google Cloud Storage (imágenes) |
| `multer` | ^1.4 | Manejo de file uploads |
| `sharp` | ^0.33 | Compresión y resize de imágenes |

### Testing

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `vitest` | ^2.0 | Test runner + assertions |
| `supertest` | ^7.0 | HTTP testing (endpoints) |
| `@faker-js/faker` | ^9.0 | Datos fake para seeds y tests |

### Dev Tools

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `tsx` | ^4.0 | Ejecutar TypeScript directamente |
| `nodemon` | ^3.0 | Auto-restart en desarrollo |
| `eslint` | ^9.0 | Linter |
| `prettier` | ^3.0 | Code formatter |
| `husky` | ^9.0 | Git hooks |
| `lint-staged` | ^15.0 | Lint solo archivos staged |

---

## Frontend — Panel de Administración

### Core

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react` | ^18.3 | UI library |
| `react-dom` | ^18.3 | DOM rendering |
| `vite` | ^5.0 | Build tool y dev server |
| `typescript` | ^5.0 | Type checking |

### Routing y Estado

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react-router-dom` | ^6.0 | Client-side routing |
| `zustand` | ^4.5 | Estado global (auth, UI) |
| `@tanstack/react-query` | ^5.0 | Server state, cache, revalidación |

### Formularios y Validación

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react-hook-form` | ^7.0 | Formularios performantes |
| `@hookform/resolvers` | ^3.0 | Integración Zod + React Hook Form |
| `zod` | ^3.23 | Schemas compartidos con backend |

### UI Components

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `lucide-react` | ^0.400 | Iconos SVG |
| `sonner` | ^1.0 | Toast notifications |
| `recharts` | ^2.0 | Gráficas para dashboard de métricas |
| `date-fns` | ^4.0 | Manipulación de fechas |

### Styling

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| CSS Modules o Vanilla CSS | — | Styling sin dependencias externas |

> **NOTA:** NO usar TailwindCSS a menos que el equipo lo apruebe explícitamente.

---

## App Móvil — Flutter

### Dependencies (pubspec.yaml)

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `flutter_riverpod` | ^2.0 | Estado reactivo |
| `dio` | ^5.0 | HTTP client con interceptors |
| `go_router` | ^14.0 | Navegación declarativa |
| `shared_preferences` | ^2.0 | Key-value storage local |
| `sqflite` | ^2.0 | SQLite para caché offline de lecturas |
| `cached_network_image` | ^3.0 | Caché de imágenes con placeholder |
| `flutter_secure_storage` | ^9.0 | Almacenamiento seguro de tokens |
| `lottie` | ^3.0 | Animaciones (gamificación, celebraciones) |
| `shimmer` | ^3.0 | Loading skeletons |
| `google_fonts` | ^6.0 | Tipografías (Inter, Nunito) |
| `fl_chart` | ^0.69 | Gráficas de progreso |
| `connectivity_plus` | ^6.0 | Detección de conectividad |

### Dev Dependencies

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `flutter_test` | SDK | Testing |
| `mockito` | ^5.0 | Mocking para tests |
| `build_runner` | ^2.0 | Code generation |
| `flutter_lints` | ^4.0 | Lint rules |

---

## Infraestructura

| Servicio | Proveedor | Propósito |
|----------|----------|-----------|
| **Hosting API** | Railway / Render | Servidor Node.js |
| **Base de datos** | Neon / Supabase DB | PostgreSQL managed |
| **Cache** | Upstash | Redis serverless |
| **Storage** | Google Cloud Storage | Imágenes de lecturas y avatares |
| **IA** | Google Gemini API | Generación de preguntas |
| **Monitoring** | Sentry | Error tracking |
| **Analytics** | Firebase Analytics | Métricas de uso |
| **Crash Reporting** | Firebase Crashlytics | Crashes de la app |
| **CI/CD** | GitHub Actions | Build, test, deploy automático |
| **App Distribution** | Google Play Store | Distribución Android |

---

## Librerías PROHIBIDAS

> Estas librerías NO deben usarse bajo ninguna circunstancia.

| Prohibida | Usar en su lugar | Razón |
|-----------|-----------------|-------|
| `moment.js` | `date-fns` | Moment está deprecado y es pesado (300KB) |
| `lodash` | Métodos nativos de JS | Innecesario en ES2024+ |
| `axios` (backend) | `fetch` nativo | Node 20 tiene fetch nativo estable |
| `jQuery` | React / vanilla JS | No tiene sentido en 2026 |
| `sequelize` | Prisma | ADR-005: Prisma es el ORM elegido |
| `typeorm` | Prisma | ADR-005: Prisma es el ORM elegido |
| `mongoose` | Prisma + PostgreSQL | ADR-002: No usamos MongoDB |
| `passport.js` | JWT manual | Over-engineering para nuestro caso |
| `next.js` (admin) | Vite + React | No necesitamos SSR para un panel admin |
| `tailwindcss` | CSS Modules / Vanilla CSS | No aprobado para este proyecto |

---

## Versiones de Node.js — Compatibilidad

```
Node.js 20.x LTS (requerido)
├── ES2024 features ✅
├── fetch() nativo ✅
├── crypto.randomUUID() ✅
├── test runner nativo ✅ (pero usamos Vitest)
└── --watch mode ✅
```

---

## Variables de Entorno

```env
# .env.example — NUNCA commitear .env real

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lectoapp?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12

# Google Cloud Storage
GCS_BUCKET_NAME=lectoapp-assets
GCS_PROJECT_ID=your-project-id
GCS_KEY_FILE=./keys/gcs-service-account.json

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Admin
ADMIN_CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

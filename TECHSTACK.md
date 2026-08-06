# TECHSTACK.md — LectoApp

**Documento:** Stack Tecnológico y Versiones  
**Versión:** 1.1 — versiones y estado (✅ instalado / 🔲 planeado) verificados contra `package.json` real, no solo contra la intención original  
**Fecha:** Agosto 2026

> Este archivo es la fuente de verdad sobre qué tecnologías usar.
> Si un agente de IA sugiere una librería que no está aquí, NO la uses sin aprobación.
> 🔲 = elegida pero todavía no instalada (el módulo que la necesita no existe todavía). ⚠️ = instalada pero sin uso real en el código — candidata a remover o a usarse pronto, no dejar así indefinidamente.

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

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `prisma` | ^5.20 | ORM + migraciones (devDependency) | ✅ |
| `@prisma/client` | ^5.20 | Client generado para queries tipadas | ✅ — output custom a `src/generated/prisma` (ver ARCHITECTURE.md, bug de Prisma 5.22+pnpm en Windows) |
| `ioredis` | ^5.0 | Cliente Redis para cache y jobs | 🔲 Fase 2 — diferido a propósito, ver ARCHITECTURE.md ADR-009 |

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

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `@google/generative-ai` | ^0.21 | Google Gemini API client | 🔲 Fase 2 — módulo `ai` no existe |
| `bullmq` | ^5.0 | Job queue para generación async de preguntas | 🔲 Fase 2 |

### Archivos y Storage

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `@google-cloud/storage` | ^7.0 | Google Cloud Storage (imágenes) | 🔲 Fase 2 — `POST /api/media/upload` ya funciona hoy contra `LocalDiskStorageProvider` (ADR-007); GCS es enchufable sin tocar el módulo |
| `multer` | ^2.2 | Manejo de file uploads | ✅ — nota: la versión real instalada es 2.x, no 1.x; multer 2 cambió el manejo de límites de tamaño respecto a 1.x, no es un simple bump de patch |
| `sharp` | — | Compresión y resize de imágenes | 🔲 No instalado — la validación de tipo de imagen se hace por magic bytes (`shared/utils/image-signature.ts`) sin `sharp`; resize/compresión del lado del servidor sigue pendiente si se necesita para el NFR de "<2s de carga en 3G" |

### Testing

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `vitest` | ^2.1 | Test runner + assertions | ✅ — 129 tests |
| `supertest` | ^7.0 | HTTP testing (endpoints) | ✅ — usado en `tests/modules/media/media.routes.test.ts` |
| `@faker-js/faker` | ^9.0 | Datos fake para seeds y tests | ⚠️ Instalado, cero usos reales — el seed (`prisma/seed/index.ts`) usa 3 lecturas escritas a mano, no datos generados. Usarlo o quitarlo la próxima vez que se toque el seed |

### Dev Tools

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `tsx` | ^4.19 | Ejecutar TypeScript directamente | ✅ |
| `nodemon` | ^3.1 | Auto-restart en desarrollo | ✅ |
| `eslint` | ^9.10 | Linter | ✅ (flat config, `eslint.config.cjs`) |
| `prettier` | ^3.3 | Code formatter | ✅ instalado — sin `pnpm format` en `package.json` todavía, se corre vía IDE o `pnpm exec prettier` |
| `husky` | ^9.0 | Git hooks | 🔲 No instalado — no hay `.husky/`, ningún hook corre hoy antes de commit/push |
| `lint-staged` | ^15.0 | Lint solo archivos staged | 🔲 No instalado — depende de husky |

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

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `lucide-react` | ^0.445 | Iconos SVG | ✅ |
| `sonner` | ^1.5 | Toast notifications | ✅ |
| `recharts` | ^2.12 | Gráficas para dashboard de métricas | ✅ — es el paquete más pesado del bundle (ver ARCHITECTURE.md, riesgo R-07: build de producción > 500KB) |
| `date-fns` | ^4.1 | Manipulación de fechas | ⚠️ Instalado, cero usos reales — las fechas hoy se muestran sin formatear especial en ningún componente. Usarlo o quitarlo la próxima vez que se toque algo con fechas |

### Testing

| Paquete | Versión | Propósito | Estado |
|---------|---------|-----------|:---:|
| `vitest` | ^2.1 | Test runner (mismo que backend) | ✅ — 109 tests |
| `@testing-library/react` | ^16.3 | Renderizar componentes y consultarlos por rol/texto accesible | ✅ |
| `@testing-library/jest-dom` | ^6.9 | Matchers de DOM (`toBeInTheDocument`, etc.) | ✅ |
| `@testing-library/user-event` | ^14.6 | Simular interacción real de usuario (click, type) | ✅ |
| `jsdom` | ^25.0 | Entorno DOM para Vitest fuera del navegador | ✅ |

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

Lista de proveedores objetivo — **ninguno está conectado todavía** (no hay ambiente desplegado, hosting bloqueado pendiente del cliente). Para el detalle de qué existe hoy vs. qué es plan (topología recomendada, riesgos, checklist de despliegue), ver `ARCHITECTURE.md` secciones 8, 12 y 13 — no se repite aquí para no tener dos fuentes de verdad que puedan desalinearse.

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
| **CI/CD** | GitHub Actions | Build, test, deploy automático — 🔲 no hay ningún workflow en `.github/workflows/` todavía, pese a que ya existen 238 tests que deberían gatillar en cada PR |
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

Copiado literal de `backend/.env.example` (fuente de verdad real — si diverge de aquí, ese archivo gana). `admin/.env.example` es solo `VITE_API_URL`.

```env
# .env.example — NUNCA commitear .env real

# Server
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lectoapp?schema=public

# Redis (Fase 2+: cache, BullMQ, leaderboard — ver ADR-009, no se usa todavía)
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
BCRYPT_SALT_ROUNDS=12

# Storage local (POST /api/media/upload — provider interino, ver ARCHITECTURE.md ADR-007)
UPLOAD_DIR=./uploads
UPLOAD_PUBLIC_PATH=/uploads
MAX_UPLOAD_SIZE_BYTES=5242880

# Google Cloud Storage — Fase 2, provider GCS (aún no implementado, ver ADR-007)
# GCS_BUCKET_NAME=lectoapp-assets
# GCS_PROJECT_ID=your-project-id
# GCS_KEY_FILE=./keys/gcs-service-account.json

# Gemini AI (Fase 2)
GEMINI_API_KEY=your-gemini-api-key

# Admin
ADMIN_CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

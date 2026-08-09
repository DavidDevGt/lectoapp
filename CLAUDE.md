# CLAUDE.md — LectoApp (Comprensión Lectora Gamificada)

> Este archivo es leído automáticamente por Claude Code y Antigravity al inicio de cada sesión.
> Última actualización: Agosto 2026

---

## Proyecto

**LectoApp** es una plataforma educativa gamificada para mejorar la comprensión lectora de estudiantes en Guatemala. Consta de tres componentes:

1. **API REST** (Node.js/Express) — Backend central
2. **Panel de Administración** (React/Vite) — Gestión de contenido por el cliente
3. **App Móvil** (React Native/Expo) — Experiencia del estudiante

El cliente (Giovanni, sector educativo, Guatemala) necesita **autonomía editorial total** sobre el contenido. Esta es la razón de existir del proyecto — ninguna app existente le permitía gestionar sus propias lecturas y preguntas.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | 22.x LTS |
| Framework backend | Express | 4.x |
| ORM | Prisma | 5.x |
| Base de datos | PostgreSQL | 16 |
| Cache | Redis | 7.x — 🔲 Fase 2, deliberadamente sin instalar todavía (ver `ARCHITECTURE.md` ADR-009) |
| Validación | Zod | 3.x |
| Auth | JWT (jsonwebtoken 9.x + bcryptjs 2.x) | — |
| Frontend admin | React 18 + Vite 5 | — |
| Estado admin | Zustand 4.x | — |
| Data fetching | TanStack Query 5.x | — |
| App móvil | React Native (Expo) | SDK 54 |
| Estado móvil | Context API + hooks | — |
| HTTP móvil | fetch (con fallback a mockData) | — |
| IA | Ollama (Local AI LLM: Llama 3 / Mistral / Gemma) | — |
| Almacenamiento | Disco local / Docker Volume (100% Self-Hosted) | — |
| Testing | Vitest (backend/admin), Jest (móvil) | — |
| Package manager | pnpm (NO yarn, NO npm) | — |

---

## Estructura del Proyecto

```
lectoapp/
├── backend/                    # API REST
│   ├── prisma/                 # Schema y migraciones
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── config/             # env.ts, database.ts (Prisma client), logger.ts (Winston)
│   │   ├── middleware/         # Auth, error handler, rate limiter, upload (multer)
│   │   ├── modules/            # Módulos de dominio — todos ✅ implementados salvo ai
│   │   │   ├── auth/           # Autenticación
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.validator.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── readings/       # Lecturas
│   │   │   ├── questions/      # Preguntas/cuestionarios
│   │   │   ├── progress/       # Progreso del estudiante
│   │   │   ├── users/          # Gestión de usuarios
│   │   │   ├── media/          # Upload de imágenes (StorageProvider)
│   │   │   ├── stats/          # Métricas del dashboard admin
│   │   │   └── ai/             # 🔲 Fase 2 — Generación de preguntas con IA, no existe todavía
│   │   ├── shared/
│   │   │   ├── errors/         # Clases de error personalizadas
│   │   │   ├── storage/        # StorageProvider + LocalDiskStorageProvider (ver ARCHITECTURE.md ADR-007)
│   │   │   ├── types/          # Tipos TypeScript compartidos
│   │   │   └── utils/          # Helpers genéricos (jwt, password, image-signature)
│   │   ├── app.ts              # Configuración de Express
│   │   └── server.ts           # Entry point
│   ├── tests/                  # Tests (mirror de src/modules) — 140 tests
│   ├── package.json
│   └── tsconfig.json
│
├── admin/                      # Panel de administración
│   ├── src/
│   │   ├── components/         # Subcarpetas por dominio: readings/, questions/, dashboard/, layout/, ui/
│   │   ├── pages/               # Páginas/vistas
│   │   ├── hooks/               # Custom hooks (uno por recurso de API, TanStack Query)
│   │   ├── services/            # API client + un service por recurso
│   │   ├── stores/              # Zustand stores (solo auth)
│   │   ├── types/               # TypeScript types
│   │   ├── test/                # renderWithProviders, mocks compartidos de test
│   │   └── utils/               # Utilidades
│   ├── package.json
│   └── vite.config.ts           # incluye el proxy /api -> localhost:3000 para dev
│
├── mobile/                     # 🔲 App del estudiante — NO iniciado (Sprint 4, ver TASKS.md)
│   ├── lib/
│   │   ├── core/               # Config, theme, constants
│   │   ├── data/               # Repositories, data sources, models
│   │   ├── domain/             # Entities, use cases
│   │   ├── presentation/       # Screens, widgets, providers
│   │   └── main.dart
│   └── pubspec.yaml
│
├── docs/                       # Documentación técnica
│   ├── api-reference.md
│   └── data-model.md
│
├── CLAUDE.md                   # ← Este archivo
├── AGENTS.md                   # Instrucciones universales para agentes
├── PRD.md                      # Requerimientos del producto
├── ARCHITECTURE.md             # Arquitectura del sistema
├── TECHSTACK.md                # Stack tecnológico detallado
├── CONVENTIONS.md              # Convenciones de código
├── TASKS.md                    # Estado actual del proyecto
└── IDEA.md                     # Brief original del cliente
```

---

## Comandos Frecuentes

### Backend
```bash
cd backend
pnpm dev                       # Servidor de desarrollo (nodemon + tsx)
pnpm build                     # Compilar TypeScript
pnpm test                      # Ejecutar tests con Vitest
pnpm test:watch                # Tests en modo watch
pnpm lint                      # ESLint
pnpm lint:fix                  # ESLint con auto-fix
pnpm exec prisma migrate dev   # Crear/aplicar migración
pnpm exec prisma generate      # Regenerar Prisma Client
pnpm exec prisma studio        # UI visual de la BD
pnpm exec prisma db seed       # Ejecutar seed de datos
```

### Admin Panel
```bash
cd admin
pnpm dev                 # Vite dev server (puerto 5173, con proxy /api -> backend)
pnpm build               # Build de producción
pnpm preview             # Preview del build
pnpm test                # Ejecutar tests con Vitest + Testing Library
pnpm test:watch          # Tests en modo watch
pnpm lint                # ESLint
```

### Mobile — 🔲 no iniciado
```bash
# Estos comandos son la convención objetivo, no funcionan todavía —
# no existe carpeta mobile/ (ver TASKS.md, Sprint 4)
cd mobile
flutter run              # Ejecutar en dispositivo/emulador
flutter build apk        # Build APK de release
flutter test             # Ejecutar tests
flutter analyze          # Análisis estático
```

---

## Reglas NO Negociables

### Seguridad
- **NUNCA** hardcodear API keys, secrets o credenciales — usar `.env`
- **NUNCA** exponer stack traces en respuestas HTTP
- **SIEMPRE** hashear passwords con bcrypt (salt rounds: 12)
- **SIEMPRE** validar inputs con Zod en el borde de cada endpoint. **SIEMPRE** sanitizar HTML de texto libre generado por el usuario (`reading.title`, `reading.content`, `question.statement`, `question.explanation`, `question.options[].text`) con `sanitizePlainText` (`shared/utils/sanitize-html.ts`, sobre `sanitize-html`) antes de persistirlo — se llama desde `reading.service.ts`/`question.service.ts` en `create`/`update`, no en el validator (Zod solo valida forma). Hoy despoja **todas** las etiquetas (política de texto plano, no un allowlist) porque ningún cliente tiene editor rich-text. Ver `ARCHITECTURE.md` → Registro de Riesgos (R-04): si se agrega un editor rich-text a futuro, esta función debe migrar a un allowlist explícito de tags seguros
- **SIEMPRE** usar parametrized queries (Prisma lo hace por defecto)

### Arquitectura
- **SIEMPRE** seguir el patrón: `Route → Middleware → Controller → Service → Prisma`
- **NUNCA** poner lógica de negocio en controllers — solo request/response
- **NUNCA** acceder a Prisma directamente desde controllers
- **NUNCA** usar SQL crudo — siempre Prisma Client
- **SIEMPRE** manejar errores con las clases de `shared/errors/`

### TypeScript
- **NUNCA** usar `any` — tipado estricto siempre
- **SIEMPRE** definir tipos de retorno explícitos en funciones públicas
- **SIEMPRE** usar interfaces para contratos y types para uniones/utilidades

### Respuestas API
Todo endpoint retorna este formato:
```typescript
{
  success: boolean;
  data: T | null;
  error: string | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

### Base de Datos
- Migraciones con nombre descriptivo: `pnpm exec prisma migrate dev --name add_reading_levels`
- Toda tabla tiene `id` y un timestamp de creación — normalmente `createdAt`, pero `UserAvatarItem` usa `purchasedAt` a propósito porque es más específico ("cuándo se compró" dice más que "cuándo se creó el registro"). `updatedAt` solo si el registro es mutable — `RefreshToken` y `QuizAttempt` no lo tienen a propósito: son hechos inmutables una vez creados, no hay "editar un intento de quiz"
- Soft delete con campo `deletedAt` (nullable) — no borrar registros físicamente. No todas las tablas lo tienen: solo las que un admin puede "eliminar" desde la UI (`User`, `Reading`); `Question`, `QuizAttempt`, `StudentProgress` no tienen `deletedAt` porque nada en el producto los borra individualmente
- Campos de texto largo usan `@db.Text`

---

## Patrones de Código

### Ejemplo de módulo backend completo
```
modules/readings/
├── reading.controller.ts   # Parsea request, llama service, retorna response
├── reading.service.ts      # Lógica de negocio (validaciones, transformaciones)
├── reading.validator.ts    # Schemas de Zod para validar inputs
├── reading.routes.ts       # Definición de rutas Express
└── reading.types.ts        # Tipos específicos del módulo
```

### Ejemplo de controller
```typescript
// reading.controller.ts
export class ReadingController {
  constructor(private readingService: ReadingService) {}

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reading = await this.readingService.findById(id);
      res.json({ success: true, data: reading, error: null });
    } catch (error) {
      next(error);
    }
  };
}
```

---

## Contexto del Negocio

### Niveles de comprensión lectora (dominio del cliente)
1. **Literal** — Comprensión directa de lo que dice el texto
2. **Inferencial** — Deducir información implícita del texto
3. **Crítico** — Evaluar, juzgar y opinar sobre el texto

### Niveles de progresión del estudiante
Principiante → Intermedio → Avanzado → Experto → Supremo

### Regla de negocio central
El estudiante DEBE completar todas las lecturas de un nivel antes de avanzar al siguiente. Cada lectura tiene un cuestionario que debe aprobarse con ≥70% para considerarse completada.

---

## Errores Conocidos / Workarounds

- **Prisma + PostgreSQL**: Usar `@db.Text` para campos de contenido de lectura (pueden ser muy largos)
- **JWT + Mobile**: Los tokens deben usar refresh token rotation para evitar re-login frecuente
- **Flutter + Gama baja**: Usar `ListView.builder` (nunca `ListView`) para listas largas — crítico para rendimiento
- **Gemini API**: Rate limiting de 60 RPM en tier gratuito — implementar cola de generación

---

## Decisiones Pendientes (preguntar al equipo)

- [ ] ¿Registro de estudiantes libre o por institución?
- [ ] ¿El primer demo de septiembre es MVP funcional o prototipo?
- [ ] ¿Hosting en Railway, Render, o VPS propio?
- [ ] Umbral de aprobación del cuestionario: ¿70% o configurable por el admin?

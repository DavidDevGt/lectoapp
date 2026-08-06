# CONVENTIONS.md — LectoApp

**Documento:** Convenciones de Código y Estilo  
**Versión:** 1.0  
**Fecha:** Agosto 2026

> Todo código en este proyecto DEBE seguir estas convenciones.
> Si un agente de IA genera código que las viola, corregir antes de commitear.

---

## 1. Naming Conventions

### Archivos y Carpetas

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos TypeScript (backend) | kebab-case | `reading-controller.ts` |
| Archivos React (componentes) | PascalCase | `ReadingCard.tsx` |
| Archivos React (hooks) | camelCase con "use" | `useReadings.ts` |
| Archivos React (stores) | camelCase con "Store" | `authStore.ts` |
| Archivos Dart (Flutter) | snake_case | `reading_screen.dart` |
| Carpetas | kebab-case | `error-handling/` |
| Tests | `*.test.ts` / `*_test.dart` | `reading.service.test.ts` |

### Código

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Clases | PascalCase | `ReadingService` |
| Interfaces | PascalCase con "I" prefix (opcional) | `IReadingRepository` |
| Types | PascalCase | `CreateReadingInput` |
| Enums | PascalCase (members: UPPER_SNAKE) | `UserRole.STUDENT` |
| Funciones | camelCase | `getReadingById()` |
| Variables | camelCase | `readingCount` |
| Constantes | UPPER_SNAKE_CASE | `MAX_QUESTIONS_PER_READING` |
| Variables de entorno | UPPER_SNAKE_CASE | `DATABASE_URL` |
| Tablas BD | snake_case, plural | `readings`, `quiz_questions` |
| Columnas BD | snake_case | `created_at`, `comprehension_level` |
| Endpoints API | kebab-case, plural | `/api/readings`, `/api/quiz-attempts` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |

---

## 2. Estructura de un Módulo Backend

Cada módulo sigue esta estructura exacta:

```
modules/readings/
├── reading.controller.ts    # Parsea request, llama service, retorna response
├── reading.service.ts       # TODA la lógica de negocio
├── reading.validator.ts     # Schemas de Zod
├── reading.routes.ts        # Definición de rutas Express
└── reading.types.ts         # Tipos TypeScript del módulo
```

### Controller (ejemplo canónico)

```typescript
import { Request, Response, NextFunction } from 'express';
import { ReadingService } from './reading.service';
import { ApiResponse } from '../../shared/types/api-response';

export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.readingService.create(req.body, req.user.id);
      const response: ApiResponse<typeof reading> = {
        success: true,
        data: reading,
        error: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const reading = await this.readingService.findById(id);
      res.json({ success: true, data: reading, error: null });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 20, level, status } = req.query;
      const result = await this.readingService.findAll({
        page: Number(page),
        limit: Number(limit),
        level: level as string,
        status: status as string,
      });
      res.json({
        success: true,
        data: result.items,
        error: null,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Service (ejemplo canónico)

```typescript
import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { CreateReadingInput, UpdateReadingInput } from './reading.types';

export class ReadingService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateReadingInput, authorId: string) {
    // Validaciones de dominio
    if (input.questions && input.questions.length < 5) {
      throw new ValidationError('Una lectura necesita al menos 5 preguntas para publicarse');
    }

    return this.prisma.reading.create({
      data: {
        title: input.title,
        content: input.content,
        comprehensionLevel: input.comprehensionLevel,
        progressionLevel: input.progressionLevel,
        status: 'DRAFT',
        authorId,
      },
    });
  }

  async findById(id: string) {
    const reading = await this.prisma.reading.findUnique({
      where: { id, deletedAt: null },
      include: { questions: true },
    });

    if (!reading) {
      throw new NotFoundError(`Lectura con ID ${id} no encontrada`);
    }

    return reading;
  }
}
```

### Validator (ejemplo canónico)

```typescript
import { z } from 'zod';

export const createReadingSchema = z.object({
  title: z.string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  content: z.string()
    .min(50, 'El contenido debe tener al menos 50 caracteres'),
  comprehensionLevel: z.enum(['LITERAL', 'INFERENTIAL', 'CRITICAL']),
  progressionLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'SUPREME']),
  coverImageUrl: z.string().url().optional(),
});

export const updateReadingSchema = createReadingSchema.partial();

export const readingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  level: z.enum(['LITERAL', 'INFERENTIAL', 'CRITICAL']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateReadingInput = z.infer<typeof createReadingSchema>;
export type UpdateReadingInput = z.infer<typeof updateReadingSchema>;
export type ReadingQuery = z.infer<typeof readingQuerySchema>;
```

### Routes (ejemplo canónico)

```typescript
import { Router } from 'express';
import { ReadingController } from './reading.controller';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createReadingSchema, updateReadingSchema, readingQuerySchema } from './reading.validator';

export function createReadingRoutes(controller: ReadingController): Router {
  const router = Router();

  router.get('/',
    authenticate,
    validate(readingQuerySchema, 'query'),
    controller.list
  );

  router.get('/:id',
    authenticate,
    controller.getById
  );

  router.post('/',
    authenticate,
    authorize('ADMIN'),
    validate(createReadingSchema),
    controller.create
  );

  router.put('/:id',
    authenticate,
    authorize('ADMIN'),
    validate(updateReadingSchema),
    controller.update
  );

  router.delete('/:id',
    authenticate,
    authorize('ADMIN'),
    controller.softDelete
  );

  return router;
}
```

---

## 3. Formato de Respuesta API

### Respuesta exitosa (un recurso)
```json
{
  "success": true,
  "data": {
    "id": "clx1234...",
    "title": "El Popol Vuh",
    "comprehensionLevel": "LITERAL"
  },
  "error": null
}
```

### Respuesta exitosa (lista con paginación)
```json
{
  "success": true,
  "data": [
    { "id": "clx1234...", "title": "El Popol Vuh" },
    { "id": "clx5678...", "title": "Leyendas de Guatemala" }
  ],
  "error": null,
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

### Respuesta de error
```json
{
  "success": false,
  "data": null,
  "error": "La lectura con ID clx9999 no fue encontrada"
}
```

### Respuesta de error de validación
```json
{
  "success": false,
  "data": null,
  "error": "Errores de validación",
  "details": [
    { "field": "title", "message": "El título debe tener al menos 3 caracteres" },
    { "field": "content", "message": "El contenido es requerido" }
  ]
}
```

---

## 4. Manejo de Errores

### Clases de error personalizadas

```typescript
// shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'No autenticado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Sin permisos para esta acción') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

### Middleware de error global

```typescript
// middleware/error-handler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
  }

  // Error inesperado — loguear pero NO exponer al cliente
  logger.error('Unhandled error', { error: err, path: req.path, method: req.method });

  return res.status(500).json({
    success: false,
    data: null,
    error: 'Error interno del servidor',
  });
}
```

---

## 5. Git Conventions

### Commits (Conventional Commits)

```
<type>(<scope>): <description>

feat(readings): add CRUD endpoints for readings
fix(auth): handle expired refresh token edge case
docs(api): update endpoint documentation
refactor(progress): extract score calculation to utility
test(readings): add unit tests for ReadingService
chore(deps): update prisma to 5.20
style(admin): fix alignment in readings table
```

### Tipos de commit

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `refactor` | Refactor sin cambio de comportamiento |
| `test` | Agregar o modificar tests |
| `chore` | Tareas de mantenimiento (deps, config) |
| `style` | Formato, espacios, punto y coma (sin cambio de lógica) |
| `perf` | Mejora de performance |
| `ci` | Cambios de CI/CD |

### Branches

```
main              ← Producción (protegido)
develop           ← Integración
feature/F1-auth   ← Feature nueva (referencia al ID del PRD)
fix/login-timeout ← Corrección de bug
hotfix/security   ← Corrección urgente en producción
```

---

## 6. Convenciones de Flutter/Dart

### Estructura de un Screen

```dart
// presentation/screens/reading_screen.dart
class ReadingScreen extends ConsumerWidget {
  final String readingId;

  const ReadingScreen({super.key, required this.readingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final readingAsync = ref.watch(readingProvider(readingId));

    return Scaffold(
      appBar: AppBar(title: const Text('Lectura')),
      body: readingAsync.when(
        data: (reading) => _ReadingContent(reading: reading),
        loading: () => const ReadingShimmer(),
        error: (error, _) => ErrorView(message: error.toString()),
      ),
    );
  }
}

// Widget privado — prefijo underscore
class _ReadingContent extends StatelessWidget {
  final Reading reading;
  const _ReadingContent({required this.reading});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Text(
        reading.content,
        style: Theme.of(context).textTheme.bodyLarge,
      ),
    );
  }
}
```

### Naming en Dart

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos | snake_case | `reading_screen.dart` |
| Clases | PascalCase | `ReadingScreen` |
| Variables | camelCase | `readingCount` |
| Constantes | camelCase o UPPER_SNAKE | `maxRetries`, `API_URL` |
| Providers | camelCase + Provider | `readingProvider` |
| Widgets privados | _PascalCase | `_ReadingContent` |

---

## 7. Convenciones de React (Panel Admin)

### Estructura de un componente

```tsx
// pages/ReadingsPage.tsx
import { useState } from 'react';
import { useReadings } from '../hooks/useReadings';
import { ReadingTable } from '../components/ReadingTable';
import { CreateReadingModal } from '../components/forms/CreateReadingModal';
import styles from './ReadingsPage.module.css';

export function ReadingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, error } = useReadings();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Lecturas</h1>
        <button onClick={() => setIsModalOpen(true)}>
          Nueva Lectura
        </button>
      </header>

      <ReadingTable readings={data?.data ?? []} />

      {isModalOpen && (
        <CreateReadingModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
```

### Reglas de componentes React
- Componentes funcionales SIEMPRE (nunca class components)
- Exportar con `export function`, no `export default`
- Props tipadas con interface inline o type separado
- Hooks personalizados para lógica reutilizable
- No más de 200 líneas por componente — dividir si crece

---

## 8. Testing Conventions

### Backend (Vitest)

```typescript
// tests/modules/readings/reading.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReadingService } from '../../../src/modules/readings/reading.service';

describe('ReadingService', () => {
  let service: ReadingService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      reading: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    };
    service = new ReadingService(prismaMock);
  });

  describe('findById', () => {
    it('should return reading when found', async () => {
      const mockReading = { id: '1', title: 'Test', content: 'Content' };
      prismaMock.reading.findUnique.mockResolvedValue(mockReading);

      const result = await service.findById('1');

      expect(result).toEqual(mockReading);
      expect(prismaMock.reading.findUnique).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: null },
        include: { questions: true },
      });
    });

    it('should throw NotFoundError when reading does not exist', async () => {
      prismaMock.reading.findUnique.mockResolvedValue(null);

      await expect(service.findById('999'))
        .rejects
        .toThrow('Lectura con ID 999 no encontrada');
    });
  });
});
```

### Naming de tests
- Archivos: `*.test.ts` (backend), `*_test.dart` (Flutter)
- Describe: nombre del módulo/clase
- It: `should [expected behavior] when [condition]`
- Nunca dejar tests con `it.skip` o `it.todo` sin crear un issue

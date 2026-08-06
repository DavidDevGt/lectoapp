# Modelo de Datos — LectoApp

**Documento:** Data Model Reference  
**Versión:** 1.0  
**Fecha:** Agosto 2026

---

## Diagrama de Entidades y Relaciones

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    User      │       │     Reading      │       │    Question      │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id           │       │ id               │       │ id               │
│ email        │  1──N │ title            │  1──N │ readingId (FK)   │
│ password     │◄──────│ content          │◄──────│ statement        │
│ name         │author │ comprehension    │       │ type             │
│ role         │       │ progression      │       │ options[]        │
│ avatarUrl    │       │ status           │       │ correctAnswer    │
│ gradeLevel   │       │ authorId (FK)    │       │ explanation      │
│ totalPoints  │       │ coverImageUrl    │       │ order            │
│ currentLevel │       │ estimatedTime    │       │ createdAt        │
│ streak       │       │ createdAt        │       │ updatedAt        │
│ createdAt    │       │ updatedAt        │       └──────────────────┘
│ updatedAt    │       │ deletedAt        │
│ deletedAt    │       └──────────────────┘
└──────┬───────┘              │
       │                      │
       │ 1──N                 │
       ▼                      │
┌──────────────────┐          │
│  QuizAttempt     │          │
├──────────────────┤          │
│ id               │     N──1 │
│ userId (FK)      │──────────┘
│ readingId (FK)   │
│ score            │
│ totalQuestions   │
│ percentage       │
│ passed           │
│ timeSpent        │
│ answers[]        │
│ createdAt        │
└──────────────────┘

       │
       │ (calculado de attempts)
       ▼
┌──────────────────┐
│ StudentProgress  │
├──────────────────┤
│ id               │
│ userId (FK)      │
│ readingId (FK)   │
│ bestScore        │
│ attempts         │
│ completed        │
│ completedAt      │
│ createdAt        │
│ updatedAt        │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  AvatarItem      │       │ UserAvatarItem   │
├──────────────────┤       ├──────────────────┤
│ id               │  1──N │ id               │
│ name             │◄──────│ userId (FK)      │
│ category         │       │ itemId (FK)      │
│ imageUrl         │       │ equipped         │
│ price            │       │ purchasedAt      │
│ rarity           │       └──────────────────┘
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│ LeaderboardEntry │ (materializada / cache en Redis)
├──────────────────┤
│ userId           │
│ userName         │
│ totalPoints      │
│ rank             │
│ updatedAt        │
└──────────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma
// Copiado literal del archivo real — si diverge de aquí, backend/prisma/schema.prisma gana.

generator client {
  provider = "prisma-client-js"
  // Output explícito: evita un bug conocido de Prisma 5.22 + pnpm en Windows
  // donde el archivo de tipos "default.d.ts" del paquete @prisma/client
  // se genera vacío (node_modules/.prisma/client/default.d.ts con 0 bytes).
  output = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  STUDENT
  ADMIN
}

enum ComprehensionLevel {
  LITERAL
  INFERENTIAL
  CRITICAL
}

enum ProgressionLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
  SUPREME
}

enum ReadingStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
}

enum QuestionStatus {
  DRAFT // Pendiente de revisión editorial (típico en preguntas generadas por IA)
  APPROVED // Revisada y lista — cuenta para el mínimo de publicación
}

enum AvatarItemCategory {
  HAT
  SHIRT
  PANTS
  SHOES
  ACCESSORY
  BACKGROUND
}

enum ItemRarity {
  COMMON
  UNCOMMON
  RARE
  EPIC
  LEGENDARY
}

// ============================================================
// MODELS
// ============================================================

model User {
  id           String           @id @default(cuid())
  email        String           @unique
  password     String
  name         String
  role         UserRole         @default(STUDENT)
  avatarUrl    String?
  gradeLevel   String? // Grado escolar (ej: "5to Primaria")
  totalPoints  Int              @default(0)
  currentLevel ProgressionLevel @default(BEGINNER)
  streak       Int              @default(0) // Días consecutivos de uso
  lastActiveAt DateTime?

  // Lockout de login (PRD F1: 5 intentos fallidos → bloqueo 15 min)
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?

  // Relaciones
  authoredReadings Reading[]         @relation("AuthoredReadings")
  quizAttempts     QuizAttempt[]
  progress         StudentProgress[]
  avatarItems      UserAvatarItem[]
  refreshTokens    RefreshToken[]

  // Timestamps
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  family    String // Para refresh token rotation
  isRevoked Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

model Reading {
  id                 String             @id @default(cuid())
  title              String
  content            String             @db.Text // Textos largos
  comprehensionLevel ComprehensionLevel
  progressionLevel   ProgressionLevel
  status             ReadingStatus      @default(DRAFT)
  coverImageUrl      String?
  estimatedTimeMin   Int? // Tiempo estimado de lectura en minutos
  order              Int                @default(0) // Orden dentro del nivel (solo edición admin)

  // Relaciones
  authorId  String
  author    User              @relation("AuthoredReadings", fields: [authorId], references: [id])
  questions Question[]
  attempts  QuizAttempt[]
  progress  StudentProgress[]

  // Timestamps
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([comprehensionLevel])
  @@index([progressionLevel])
  @@index([status])
  @@index([authorId])
  @@map("readings")
}

model Question {
  id        String       @id @default(cuid())
  statement String       @db.Text // Enunciado de la pregunta
  type      QuestionType @default(MULTIPLE_CHOICE)
  // MULTIPLE_CHOICE: [{ "id": "a", "text": "..." }, { "id": "b", "text": "..." }, ...] (4 opciones)
  // TRUE_FALSE:      [{ "id": "true", "text": "Verdadero" }, { "id": "false", "text": "Falso" }]
  options       Json
  correctAnswer String // "a"|"b"|"c"|"d" (MULTIPLE_CHOICE) o "true"|"false" (TRUE_FALSE)
  explanation   String?        @db.Text // Explicación de la respuesta correcta
  order         Int            @default(0)
  isAiGenerated Boolean        @default(false)
  status        QuestionStatus @default(APPROVED) // Preguntas creadas por IA nacen en DRAFT

  // Relaciones
  readingId String
  reading   Reading @relation(fields: [readingId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([readingId])
  @@index([readingId, status])
  @@map("questions")
}

model QuizAttempt {
  id             String  @id @default(cuid())
  score          Int // Respuestas correctas
  totalQuestions Int // Total de preguntas
  percentage     Float // score / totalQuestions * 100
  passed         Boolean // percentage >= 70
  timeSpentSec   Int? // Tiempo en segundos
  answers        Json // [{ questionId, selectedAnswer, isCorrect }]

  // Relaciones
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  readingId String
  reading   Reading @relation(fields: [readingId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([readingId])
  @@index([userId, readingId])
  @@map("quiz_attempts")
}

model StudentProgress {
  id          String    @id @default(cuid())
  bestScore   Float     @default(0) // Mejor porcentaje
  attempts    Int       @default(0) // Número de intentos
  completed   Boolean   @default(false)
  completedAt DateTime?

  // Relaciones
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  readingId String
  reading   Reading @relation(fields: [readingId], references: [id])

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, readingId]) // Un progreso por usuario por lectura
  @@index([userId])
  @@index([readingId])
  @@map("student_progress")
}

// ============================================================
// GAMIFICATION (Fase 3)
// ============================================================

model AvatarItem {
  id        String             @id @default(cuid())
  name      String
  category  AvatarItemCategory
  imageUrl  String
  price     Int // Precio en puntos
  rarity    ItemRarity         @default(COMMON)
  isDefault Boolean            @default(false) // Items gratuitos iniciales

  // Relaciones
  owners UserAvatarItem[]

  // Timestamps
  createdAt DateTime @default(now())

  @@map("avatar_items")
}

model UserAvatarItem {
  id       String  @id @default(cuid())
  equipped Boolean @default(false)

  // Relaciones
  userId String
  user   User       @relation(fields: [userId], references: [id])
  itemId String
  item   AvatarItem @relation(fields: [itemId], references: [id])

  // Timestamps
  purchasedAt DateTime @default(now())

  @@unique([userId, itemId]) // Un usuario no puede comprar el mismo item dos veces
  @@index([userId])
  @@map("user_avatar_items")
}
```

---

## Índices y Performance

### Queries más frecuentes y sus índices

| Query | Índice que la soporta |
|-------|----------------------|
| Lecturas publicadas por nivel de comprensión | `@@index([comprehensionLevel])` + filtro `status = PUBLISHED` |
| Lecturas por nivel de progresión | `@@index([progressionLevel])` |
| Preguntas de una lectura | `@@index([readingId])` |
| Intentos de un estudiante | `@@index([userId])` en quiz_attempts |
| Progreso de un estudiante en una lectura | `@@unique([userId, readingId])` en student_progress |
| Leaderboard (Top N por puntos) | `totalPoints` en users (considerar Redis Sorted Set) |
| Refresh token lookup | `@@index([token])` en refresh_tokens |

### Queries complejas anticipadas

```sql
-- Lecturas disponibles para un estudiante en su nivel actual
-- (publicadas, del nivel actual, no completadas)
SELECT r.* FROM readings r
LEFT JOIN student_progress sp ON sp.reading_id = r.id AND sp.user_id = $userId
WHERE r.status = 'PUBLISHED'
  AND r.progression_level = $currentLevel
  AND r.deleted_at IS NULL
  AND (sp.completed IS NULL OR sp.completed = false)
ORDER BY r."order" ASC;

-- Progreso general por nivel de comprensión
SELECT
  r.comprehension_level,
  COUNT(DISTINCT r.id) as total_readings,
  COUNT(DISTINCT CASE WHEN sp.completed = true THEN r.id END) as completed,
  ROUND(
    COUNT(DISTINCT CASE WHEN sp.completed = true THEN r.id END)::numeric /
    NULLIF(COUNT(DISTINCT r.id), 0) * 100, 1
  ) as percentage
FROM readings r
LEFT JOIN student_progress sp ON sp.reading_id = r.id AND sp.user_id = $userId
WHERE r.status = 'PUBLISHED' AND r.deleted_at IS NULL
GROUP BY r.comprehension_level;
```

---

## Seed Data

El seed inicial debe incluir:

1. **Admin por defecto:**
   - Email: `admin@lectoapp.gt`
   - Password: `LectoAdmin2026!` (cambiar en producción)
   - Role: ADMIN

2. **3 lecturas de ejemplo** (una por nivel de comprensión):
   - Literal: Texto corto y directo
   - Inferencial: Texto con información implícita
   - Crítico: Texto que requiere análisis y opinión

3. **5 preguntas aprobadas por lectura** (`status: APPROVED`, mínimo para publicar)

4. **Avatar items por defecto** (gratuitos):
   - 3 colores de camisa base
   - 2 fondos base
   - 1 avatar neutro

---

## Consideraciones de Migración

- Cada migración tiene un nombre descriptivo: `add_reading_status`, `add_gamification_tables`
- Las migraciones son incrementales — NUNCA editar una migración ya aplicada
- Para cambios destructivos (eliminar columna), crear migración de datos primero
- Ambiente de staging recibe migraciones antes que producción

# Archivos Esenciales para Agentes de IA en Desarrollo de Software
### Cómo evitar alucinaciones, mantener contexto y construir lo correcto

**Basado en:** Investigación web, prácticas de la industria 2025–2026  
**Fecha:** Agosto 2026

---

## 🧠 El concepto clave: Context Engineering

En 2026 ya no hablamos de *Prompt Engineering* (escribir buenos prompts). Hablamos de **Context Engineering**: el arte de curar la información que le das a un agente de IA para que **nunca invente, nunca alucine, y siempre trabaje dentro de los límites de tu proyecto**.

> **Un agente de IA sin contexto es como un desarrollador contratado al que le dices "haz la app" sin darle los requerimientos, el diseño, ni el acceso al código.** Va a inventar. Garantizado.

La solución: **archivos de contexto** que viven en tu repositorio y que el agente lee automáticamente antes de escribir una sola línea de código.

---

## 📂 El ecosistema completo de archivos de contexto

### Mapa visual

```
📁 tu-proyecto/
├── 📄 CLAUDE.md              ← Instrucciones para Claude Code
├── 📄 AGENTS.md              ← Estándar universal (multi-herramienta)
├── 📄 PRD.md                 ← Requerimientos del producto
├── 📄 ARCHITECTURE.md        ← Arquitectura del sistema
├── 📄 TECHSTACK.md           ← Stack tecnológico y versiones
├── 📄 TASKS.md               ← Tareas pendientes y progreso
├── 📄 CONVENTIONS.md         ← Convenciones de código
│
├── 📁 .cursor/
│   └── 📁 rules/
│       ├── 📄 general.mdc    ← Reglas para Cursor AI
│       ├── 📄 backend.mdc
│       └── 📄 frontend.mdc
│
├── 📁 .github/
│   └── 📄 copilot-instructions.md  ← Instrucciones para GitHub Copilot
│
├── 📄 .windsurfrules         ← Reglas para Windsurf/Cascade
│
├── 📁 docs/
│   ├── 📄 api-reference.md   ← Documentación de API
│   ├── 📄 data-model.md      ← Modelo de datos
│   └── 📄 deployment.md      ← Guía de deployment
│
└── 📁 tasks/                 ← PRDs por feature (opcional)
    ├── 📄 prd-auth.md
    └── 📄 prd-gamification.md
```

---

## 1. CLAUDE.md — El manual de instrucciones para Claude

### ¿Qué es?
Es un archivo que **Claude Code lee automáticamente** al inicio de cada sesión. Funciona como un "system prompt persistente" específico de tu proyecto.

### ¿Por qué es crítico?
Claude es *stateless* — olvida todo entre sesiones. Sin este archivo, cada vez que abres una sesión nueva, Claude tiene que "redescubrir" tu proyecto desde cero.

### Estructura recomendada (máximo 200–300 líneas)

```markdown
# CLAUDE.md

## Proyecto
App educativa gamificada de comprensión lectora para Guatemala.
Backend Node.js + PostgreSQL. App móvil Flutter. Panel admin React.

## Stack Tecnológico
- Backend: Node.js 20 + Express + Prisma ORM
- Base de datos: PostgreSQL 16
- Frontend admin: React 18 + Vite
- App móvil: Flutter 3.x (Android prioritario)
- Auth: JWT con refresh tokens
- IA: Google Gemini API para generación de preguntas

## Comandos frecuentes
- pnpm dev — levantar backend en desarrollo
- pnpm test — ejecutar tests con Vitest
- pnpm exec prisma migrate dev — aplicar migraciones de BD
- flutter run — ejecutar app móvil

## Estructura del proyecto
/backend     → API REST (Express)
/admin       → Panel de administración (React)
/mobile      → App del estudiante (Flutter)
/shared      → Tipos y utilidades compartidas
/docs        → Documentación técnica

## Reglas NO negociables
- NUNCA hardcodear API keys — usar variables de entorno
- SIEMPRE usar Prisma para queries — no SQL crudo
- SIEMPRE validar inputs con Zod antes de procesarlos
- Los endpoints SIEMPRE retornan { success, data, error }
- NO usar any en TypeScript — tipado estricto
- NO crear archivos fuera de la estructura definida

## Patrones de código
- Controladores en /controllers — solo manejan request/response
- Lógica de negocio en /services — nunca en controladores
- Validaciones en /validators — usando schemas de Zod
- Middleware de auth en /middleware/auth.ts

## Errores conocidos / Workarounds
- Prisma + PostgreSQL: usar @db.Text para campos de lectura largos
- Flutter: el widget de lectura necesita scroll controller personalizado
```

### Jerarquía de CLAUDE.md

| Ubicación | Alcance | Ejemplo |
|-----------|---------|---------|
| `~/.claude/CLAUDE.md` | Global (todos tus proyectos) | "Siempre responde en español" |
| `./CLAUDE.md` | Proyecto (commitear a git) | Stack, arquitectura, comandos |
| `./CLAUDE.local.md` | Personal (no commitear) | API keys de prueba, paths locales |
| `./backend/CLAUDE.md` | Subdirectorio | Reglas solo para el backend |

---

## 2. AGENTS.md — El estándar universal

### ¿Qué es?
Es el **estándar abierto e independiente de herramienta** que funciona con Cursor, Copilot, Windsurf, Claude, Codex, Gemini, y cualquier agente futuro. Es el "README para máquinas".

### ¿Por qué usarlo si ya tengo CLAUDE.md?
Porque tu equipo puede usar distintas herramientas. AGENTS.md es el denominador común.

### Estructura recomendada (máximo 150 líneas)

```markdown
# AGENTS.md

## Descripción del proyecto
App de comprensión lectora gamificada con CMS administrable.
El sistema permite a un administrador subir lecturas, clasificarlas
por nivel (Literal, Inferencial, Crítico), y generar cuestionarios
automáticamente con IA. Los estudiantes leen, responden, y avanzan
en una ruta de aprendizaje gamificada.

## Reglas de comportamiento
- Antes de modificar código, lee el archivo completo
- No cambies archivos que no se te pidan
- Si no estás seguro, pregunta antes de asumir
- Ejecuta tests después de cada cambio significativo

## Comandos
- Build: pnpm build
- Test: pnpm test
- Lint: pnpm lint
- Dev server: pnpm dev
- Migraciones: pnpm exec prisma migrate dev

## Convenciones de código
- Nombres de archivos: kebab-case (my-component.tsx)
- Componentes React: PascalCase
- Funciones: camelCase
- Variables de entorno: UPPER_SNAKE_CASE
- Commits: conventional commits (feat:, fix:, docs:)

## Lo que NO debes hacer
- No instalar dependencias sin consultarme
- No modificar archivos de configuración de la raíz
- No crear endpoints sin validación
- No usar console.log en producción — usar el logger
```

### Tip: Symlinks para no duplicar
Si usas múltiples herramientas, puedes crear symlinks:
```powershell
# En Windows (PowerShell como admin):
New-Item -ItemType SymbolicLink -Path CLAUDE.md -Target AGENTS.md

# En Linux/Mac:
ln -s AGENTS.md CLAUDE.md
```

---

## 3. PRD.md — Requerimientos del Producto

### ¿Qué es?
El **Product Requirements Document** adaptado para que los agentes de IA lo usen como fuente de verdad sobre **qué construir y por qué**.

### ¿Qué resuelve?
Sin esto, la IA solo sabe *cómo* escribir código, pero no *qué* debe lograr. Es la diferencia entre "construir un login" y "construir un login para estudiantes de primaria en Guatemala con correo institucional".

### Estructura recomendada

```markdown
# PRD: App de Comprensión Lectora Gamificada

## Resumen
Aplicación móvil educativa que mejora la comprensión lectora de
estudiantes a través de lecturas clasificadas por nivel y
cuestionarios gamificados, con un panel administrativo para
gestión autónoma de contenido.

## Problema
El cliente produce materiales de comprensión lectora pero depende
de terceros para digitalizarlos. Las apps existentes no permiten
gestión de contenido propia.

## Usuarios
1. Estudiante — Lee, responde cuestionarios, avanza en niveles
2. Administrador — Sube lecturas, crea preguntas, gestiona contenido

## Funcionalidades (Fase 1 — MVP)
### F1: Autenticación
- Login con correo electrónico
- Roles: estudiante / administrador
- Criterio de éxito: el usuario puede entrar y ver su dashboard

### F2: Ruta de aprendizaje
- Mapa visual de progresión por niveles
- Niveles: Principiante → Intermedio → Avanzado → Supremo
- Cada nodo = un reto (lectura + cuestionario)

### F3: Lecturas y cuestionarios
- El estudiante lee un texto completo
- Responde preguntas de opción múltiple
- Avanza al siguiente nivel si aprueba

### F4: Panel de administración
- CRUD de lecturas (texto + metadatos)
- Clasificación por nivel: Literal / Inferencial / Crítico
- CRUD de preguntas por lectura

## Métricas de éxito
- El administrador puede subir una lectura en < 5 minutos
- Un estudiante completa un reto en < 10 minutos
- La app funciona fluida en Android gama baja

## Restricciones
- Público objetivo: Guatemala, conectividad heterogénea
- Dispositivos: Android gama baja predomina
- Presupuesto: pagos mensuales por entregable
```

---

## 4. ARCHITECTURE.md — Intención Arquitectónica

### ¿Qué es?
Documenta el **"por qué"** detrás del diseño del sistema. La IA sabe escribir código en muchos patrones — este archivo le dice **cuál patrón usar en TU proyecto**.

### ¿Qué previene?
**Architectural drift** — cuando la IA introduce patrones que conflictúan con tu diseño (ej: meter lógica de negocio en un controlador porque "funciona").

### Estructura recomendada

```markdown
# ARCHITECTURE.md

## Visión general
Arquitectura de 3 capas con API REST central.

## Diagrama
[App Móvil Flutter] → [API REST Node.js] ← [Panel Admin React]
                            |
                    [PostgreSQL + Redis]
                            |
                    [Gemini API (IA)]

## Patrones de diseño
- Backend: Service Layer Pattern
  - Controllers → solo parsean request y retornan response
  - Services → toda la lógica de negocio
  - Repositories → acceso a datos via Prisma

- Frontend: Component-based con estado centralizado
  - Zustand para estado global (admin)
  - Provider pattern (Flutter)

## Flujo de datos
1. Cliente envía request → Controller
2. Controller valida input → pasa a Service
3. Service ejecuta lógica → llama a Repository si necesita datos
4. Repository consulta Prisma/BD → retorna datos
5. Service retorna resultado → Controller responde al cliente

## Decisiones de arquitectura
| Decisión | Elegimos | Alternativa descartada | Por qué |
|----------|----------|------------------------|---------|
| ORM | Prisma | TypeORM | Mejor type safety, migraciones declarativas |
| Auth | JWT | Sessions | App móvil stateless, no queremos cookies |
| BD | PostgreSQL | MongoDB | Datos relacionales (lecturas → preguntas → niveles) |
| App | Flutter | React Native | Rendimiento en gama baja, single codebase |
```

---

## 5. TECHSTACK.md — Stack y versiones exactas

### ¿Qué es?
La **fuente de verdad** sobre qué tecnologías, versiones y librerías usar.

### ¿Qué previene?
Que la IA sugiera librerías deprecadas, versiones incompatibles, o paquetes que no existen ("alucinaciones de paquetes" — un problema real y común).

### Estructura recomendada

```markdown
# TECHSTACK.md

## Runtime
- Node.js: 20.x LTS
- Dart/Flutter: 3.x stable

## Backend
- Express: 4.x
- Prisma ORM: 5.x
- Zod (validación): 3.x
- jsonwebtoken: 9.x
- bcryptjs: 2.x
- cors, helmet, morgan (middleware estándar)

## Base de datos
- PostgreSQL: 16
- Redis: 7 (cache + sesiones)

## Frontend (Panel Admin)
- React: 18
- Vite: 5.x
- React Router: 6.x
- TanStack Query: 5.x (data fetching)
- Zustand: 4.x (estado global)

## App Móvil
- Flutter: 3.x
- Provider / Riverpod (estado)
- dio (HTTP client)
- shared_preferences (storage local)

## Testing
- Vitest (backend + admin)
- Flutter test (móvil)

## IA
- Google Gemini API (generación de preguntas)

## Herramientas de desarrollo
- Package manager: pnpm (NO usar yarn ni npm)
- Linter: ESLint + Prettier
- Git hooks: Husky + lint-staged

## Librerías PROHIBIDAS
- moment.js → usar date-fns
- lodash → usar métodos nativos de JS
- axios → usar fetch nativo (backend) / dio (Flutter)
- jQuery → no
```

---

## 6. TASKS.md — Estado actual del proyecto

### ¿Qué es?
Un archivo vivo que le dice a la IA **en qué punto del proyecto estamos**, qué está hecho, qué sigue, y qué está en progreso.

### ¿Qué previene?
Que la IA rehaga trabajo ya completado o empiece por el módulo equivocado.

```markdown
# TASKS.md — Estado del Proyecto

## Fase actual: Fase 1 — MVP

### Completado
- [x] Setup del repositorio
- [x] Estructura de carpetas
- [x] Configuración de Prisma + PostgreSQL
- [x] Modelo de datos (lecturas, preguntas, usuarios)

### En progreso
- [/] API de autenticación (login/registro)
- [/] CRUD de lecturas (endpoint + validaciones)

### Pendiente
- [ ] CRUD de preguntas
- [ ] Panel de administración (React)
- [ ] App móvil — pantalla de login
- [ ] App móvil — ruta de aprendizaje
- [ ] App móvil — flujo lectura → cuestionario

### Bloqueado
- [ ] Generación de preguntas con IA — esperando definición de prompt

### Notas
- El cliente confirmó que Android es prioritario
- Primer demo: primera semana de septiembre
```

---

## 7. CONVENTIONS.md — Convenciones de código

### ¿Qué es?
Reglas específicas de cómo escribir código en este proyecto. Si AGENTS.md es el "qué hacer", este es el "cómo hacerlo exactamente".

```markdown
# CONVENTIONS.md

## Nombres
- Archivos: kebab-case → reading-controller.ts
- Clases/Componentes: PascalCase → ReadingController
- Funciones/variables: camelCase → getReadingById
- Constantes: UPPER_SNAKE → MAX_QUESTIONS_PER_READING
- Tablas BD: snake_case plural → readings, quiz_questions

## Estructura de un endpoint
1. Router define la ruta → /api/readings/:id
2. Middleware valida auth → authenticate
3. Validator valida body → validateReading
4. Controller procesa → readingController.getById
5. Service ejecuta → readingService.findById

## Formato de respuesta API
{
  "success": true|false,
  "data": { ... } | null,
  "error": "mensaje" | null,
  "meta": { "page": 1, "total": 50 }  // solo en listas
}

## Manejo de errores
- Usar clases de error personalizadas (AppError)
- Nunca exponer stack traces al cliente
- Loguear errores con contexto (userId, endpoint, timestamp)

## Commits
- feat: nueva funcionalidad
- fix: corrección de bug
- docs: documentación
- refactor: refactorización sin cambio de comportamiento
- test: agregar o modificar tests
- chore: tareas de mantenimiento
```

---

## 8. Archivos específicos por herramienta

### .cursor/rules/*.mdc (Cursor AI)
Archivos YAML con frontmatter que aplican reglas según el tipo de archivo:
```yaml
---
description: Reglas para archivos del backend
globs: ["backend/**/*.ts"]
---
- Usa Prisma para todas las queries
- Valida inputs con Zod
- Sigue el patrón Controller → Service → Repository
```

### .github/copilot-instructions.md (GitHub Copilot)
```markdown
Este proyecto es una app educativa para Guatemala.
Backend: Node.js + Express + Prisma + PostgreSQL.
Siempre usar TypeScript estricto.
Formato de respuesta: { success, data, error }.
```

### .windsurfrules (Windsurf/Cascade)
```markdown
Eres un desarrollador senior trabajando en una app educativa.
Stack: Node.js, React, Flutter, PostgreSQL.
Nunca uses any en TypeScript.
Siempre escribe tests para código nuevo.
```

---

## Resumen: ¿Qué archivo resuelve qué problema?

| Archivo | Problema que resuelve | Prioridad |
|---------|----------------------|-----------|
| **CLAUDE.md / AGENTS.md** | La IA no conoce tu proyecto | 🔴 Crítico |
| **PRD.md** | La IA no sabe QUÉ construir ni POR QUÉ | 🔴 Crítico |
| **ARCHITECTURE.md** | La IA mezcla patrones arquitectónicos | 🟡 Alto |
| **TECHSTACK.md** | La IA sugiere librerías incorrectas/deprecadas | 🟡 Alto |
| **TASKS.md** | La IA no sabe en qué punto del proyecto estamos | 🟡 Alto |
| **CONVENTIONS.md** | La IA escribe código con estilo inconsistente | 🟢 Medio |
| **.cursor/rules/** | Reglas granulares por tipo de archivo (Cursor) | 🟢 Medio |
| **copilot-instructions.md** | Instrucciones específicas para Copilot | 🟢 Medio |

---

## Recomendación para nuestro proyecto

Para la App de Comprensión Lectora de Giovanni, crear estos archivos **antes de escribir la primera línea de código**:

```
Prioridad 1 (día 1):
  ├── CLAUDE.md          → Para que el agente conozca el proyecto
  ├── PRD.md             → Para que sepa QUÉ construir
  └── ARCHITECTURE.md    → Para que sepa CÓMO está diseñado

Prioridad 2 (semana 1):
  ├── TECHSTACK.md       → Para que use las librerías correctas
  ├── CONVENTIONS.md     → Para que el código sea consistente
  └── TASKS.md           → Para que sepa qué está hecho y qué falta

Prioridad 3 (según la herramienta que usemos):
  ├── .cursor/rules/     → Si usamos Cursor
  ├── copilot-instructions.md → Si usamos Copilot
  └── .windsurfrules     → Si usamos Windsurf
```

---

## La regla final

> **Cada vez que la IA alucina, no es un error de la IA — es un error de documentación.**
> Trátalo como un bug: identifica qué contexto faltaba y agrégalo al archivo correspondiente.

Así, con cada iteración, tu proyecto se vuelve **más resistente a alucinaciones** y los agentes trabajan con mayor precisión.

---

*Fuentes: Anthropic (CLAUDE.md best practices), GitHub (copilot-instructions docs), Cursor (rules documentation), comunidad open-source AGENTS.md, investigación de context engineering 2025–2026.*

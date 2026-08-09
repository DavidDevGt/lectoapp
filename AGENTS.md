# AGENTS.md — LectoApp

> Estándar universal de instrucciones para agentes de IA (Antigravity, Claude Code, Cursor, Copilot, Windsurf, Codex).
> Este archivo es leído automáticamente por la mayoría de agentes al inicio de cada sesión.

---

## Descripción del Proyecto

**LectoApp** — Plataforma educativa gamificada de comprensión lectora para Guatemala.

Tres componentes:
- **API REST** (`/backend`) — Node.js 20, Express, Prisma, PostgreSQL
- **Panel Admin** (`/admin`) — React 18, Vite, Zustand
- **App Móvil** (`/mobile`) — React Native Expo (Android prioritario)

El requerimiento crítico del cliente: **autonomía total para gestionar contenido** (lecturas y preguntas) sin depender de terceros.

---

## Documentación de referencia

Antes de escribir código, consulta estos archivos:
- `CLAUDE.md` — Contexto completo del proyecto, stack, patrones, reglas
- `PRD.md` — Requerimientos del producto (qué construir y por qué)
- `ARCHITECTURE.md` — Diseño del sistema y decisiones arquitectónicas
- `TECHSTACK.md` — Tecnologías y versiones exactas
- `CONVENTIONS.md` — Convenciones de código y naming
- `TASKS.md` — Estado actual (qué está hecho, qué falta)
- `docs/data-model.md` — Modelo de datos y relaciones
- `docs/api-reference.md` — Endpoints de la API

---

## Reglas de Comportamiento

1. **Lee antes de escribir** — Antes de modificar un archivo, léelo completo para entender el contexto
2. **No asumas** — Si un requerimiento es ambiguo, pregunta antes de implementar
3. **No toques lo que no se te pide** — Modifica solo los archivos necesarios para la tarea actual
4. **Ejecuta tests** — Después de cada cambio significativo, corre `pnpm test`
5. **Valida el build** — Antes de considerar una tarea terminada, verifica que compile
6. **No instales dependencias** sin consultar — Propón la dependencia y espera aprobación
7. **No modifiques archivos de configuración raíz** sin consultar (tsconfig, package.json, prisma schema)
8. **Responde en español** — El equipo trabaja en español

---

## Pipeline de Desarrollo (6 agentes)

Para features no triviales (nuevo endpoint, nueva pantalla, cambio de lógica de negocio), el trabajo se organiza en 6 fases, cada una con un rol y límites claros. En Claude Code están definidas como subagentes en `.claude/agents/`:

| # | Agente | Responsabilidad | Puede editar código |
|---|--------|------------------|:---:|
| 1 | `especificador` | Requisitos, contrato de API/interfaz, casos borde, criterios de aceptación | ❌ |
| 2 | `codificador` | Implementa con **TDD estricto** (test que falla → código mínimo → repetir) | ✅ |
| 3 | `limpiador` | Refactor y limpieza priorizando por CRAP score (complejidad alta + cobertura baja) — sin cambiar comportamiento | ✅ |
| 4 | `arquitecto` | Verifica capas (Route→Middleware→Validator→Controller→Service→Prisma), límites de módulo, dirección de dependencias | ✅ |
| 5 | `hardener` | Mutation testing — confirma que los tests detectan fallos reales, no solo dan cobertura | ✅ |
| 6 | `qa` | Gate final independiente: build, lint, tests, checklist de criterios de aceptación | ❌ (solo reporta) |

**Cuándo usarlo:** features nuevas o cambios de lógica de negocio con alcance claro. **Cuándo NO usarlo:** fixes de una línea, cambios cosméticos, tareas puramente exploratorias — el overhead de 6 fases no se justifica.

Cada agente arranca sin memoria de los anteriores — el orquestador (la sesión principal) pasa explícitamente el output de una fase como input de la siguiente.

---

## Comandos de Desarrollo

```bash
# Backend
cd backend && pnpm dev                    # Dev server
cd backend && pnpm test                   # Tests
cd backend && pnpm lint                   # Linter
cd backend && pnpm exec prisma migrate dev  # Migraciones
cd backend && pnpm exec prisma studio     # UI de BD

# Admin
cd admin && pnpm dev               # Vite dev server (5173)
cd admin && pnpm build             # Build producción
cd admin && pnpm test              # Tests (Vitest + Testing Library)

# Mobile
cd mobile && pnpm start            # Metro bundler (Expo Go / QR)
cd mobile && pnpm web              # Previsualizar en navegador web
cd mobile && pnpm android          # Ejecutar en emulador Android
```

---

## Patrones Obligatorios

### Backend (Node.js/Express)
```
Request → Route → Auth Middleware → Validator (Zod) → Controller → Service → Prisma → Response
```
- Controllers: solo parsean request y retornan response
- Services: toda la lógica de negocio
- Validators: schemas de Zod
- Errores: clases personalizadas en `shared/errors/`

### Formato de respuesta API
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Frontend (React)
- Componentes funcionales con hooks
- Estado global con Zustand (stores en `/stores`)
- Data fetching con TanStack Query (queries en `/hooks`)
- Routing con React Router v6

### Mobile (Flutter)
- Clean Architecture: data → domain → presentation
- Estado con Riverpod
- HTTP con Dio
- Navegación con GoRouter

---

## Lo que NO Debes Hacer

- ❌ Usar `any` en TypeScript
- ❌ Escribir SQL crudo (usar Prisma)
- ❌ Poner lógica de negocio en controllers
- ❌ Hardcodear valores de configuración
- ❌ Usar `console.log` en producción (usar el logger)
- ❌ Crear endpoints sin validación de input
- ❌ Retornar errores con stack traces al cliente
- ❌ Borrar registros físicamente (usar soft delete con `deletedAt`)
- ❌ Commitear archivos `.env`
- ❌ Usar librerías prohibidas: moment.js, lodash, axios (backend), jQuery

---

## Contexto del Dominio

### Niveles de comprensión lectora
| Nivel | Qué mide |
|-------|----------|
| **Literal** | Comprensión directa del texto |
| **Inferencial** | Deducción de información implícita |
| **Crítico** | Evaluación y juicio sobre el texto |

### Progresión del estudiante
`Principiante → Intermedio → Avanzado → Experto → Supremo`

### Regla de negocio central
Aprobar cuestionario con ≥70% → lectura completada → completar todas las lecturas del nivel → avanzar al siguiente nivel.

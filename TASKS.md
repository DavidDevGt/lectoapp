# TASKS.md — LectoApp Estado del Proyecto

**Última actualización:** Agosto 2026 — auditoría completa de alineación docs↔código  
**Fase actual:** Fase 1 MVP — Sprint 3 (Panel de Admin) completo, falta Sprint 4 (Mobile)

---

## Estado General

```
█████████████████░░░ 85% — Backend + Admin panel + App Móvil completos y verificados (408 tests: 211 backend + 138 admin + 59 mobile, coverage thresholds, builds y typecheck limpios) — listos para demo/portafolio, Fase 2 (IA) y Fase 3 (Gamificación)
```

---

## Fase 0: Discovery y Arquitectura (Semana actual)

### ✅ Completado
- [x] Brief del cliente (IDEA.md)
- [x] Metodología de desarrollo con IA (AI_DESARROLLO.md)
- [x] Guía de archivos de contexto (ARCHIVOS_CONTEXTO_IA.md)
- [x] CLAUDE.md — Contexto del proyecto para agentes
- [x] AGENTS.md — Instrucciones universales para agentes
- [x] PRD.md — Requerimientos del producto
- [x] ARCHITECTURE.md — Arquitectura del sistema
- [x] TECHSTACK.md — Stack tecnológico y versiones
- [x] CONVENTIONS.md — Convenciones de código
- [x] TASKS.md — Este archivo
- [x] docs/data-model.md — Modelo de datos
- [x] docs/api-reference.md — Referencia de API

- [x] Setup del repositorio Git
- [x] Corrección de inconsistencias entre PRD/data-model/api-reference (estado de revisión de preguntas IA, orden de preguntas, lockout de login)

### 📋 Pendiente
- [ ] Reunión de dimensionamiento con el cliente (martes)
- [ ] Validar stack tecnológico con el cliente
- [ ] Definir plataformas (¿solo Android o Android + iOS?)
- [ ] Definir hosting y presupuesto operativo
- [ ] Expediente de propuesta financiera (entrega: jueves 9)
- [x] Inicializar proyecto admin
- [ ] Inicializar proyecto mobile
- [x] Pipeline de 6 agentes (especificador/codificador/limpiador/arquitecto/hardener/qa) definido en `.claude/agents/` — ver `AGENTS.md`

---

## Fase 1: MVP (Agosto – Septiembre 2026)

### Sprint 1 — Backend Core (Semana 1–2)
- [x] Inicializar proyecto Node.js + TypeScript (`backend/`, build y type-check verificados)
- [x] Configurar Express + middleware (cors, helmet, morgan, compression, rate-limit)
- [x] Configurar Prisma (schema completo) — pendiente conectar a una instancia real de PostgreSQL
- [x] Crear schema de Prisma (todas las entidades)
- [x] Ejecutar primera migración (`pnpm exec prisma migrate dev --name init`) — corrida contra Postgres 16 en Docker (contenedor `lectoapp-postgres`, puerto 5433 — el 5432 lo ocupa un Postgres nativo de Windows ya instalado)
- [x] Implementar sistema de errores personalizados (`shared/errors`)
- [x] Implementar middleware de validación (Zod)
- [x] Implementar módulo `auth` (registro, login, refresh token con rotation, logout)
- [x] Implementar middleware de autenticación JWT
- [x] Implementar middleware de autorización por roles
- [x] Lockout de cuenta tras 5 intentos fallidos (15 min) — campo agregado a `data-model.md`
- [x] Seed de datos iniciales (admin default, 3 lecturas de ejemplo con 5 preguntas c/u, avatar items)
- [x] Tests unitarios del módulo auth (7/7 pasando con Vitest)

### Sprint 2 — Content Management (adelantado)
- [x] Implementar módulo `readings` (CRUD, filtros, vista admin vs estudiante)
- [x] Implementar módulo `questions` (CRUD anidado, flujo DRAFT → APPROVED)
- [x] Implementar módulo `users` (perfil propio + listado admin)
- [x] Implementar módulo `progress` (submit de quiz, cálculo de score/streak/puntos/level-up, historial)
- [x] Validación: mínimo 5 preguntas **aprobadas** para publicar
- [x] Tests unitarios de los 4 módulos (24/24 pasando con Vitest)
- [x] **Hardener (mutation testing):** 11 tests nuevos añadidos, 0 mutantes survivientes — se cubren bordes de umbral 70%, bestScore, isNewCompletion, level-up cross-level, streak, lockout en 5to intento, expiración de lock, mínimo 5 preguntas, orden de topReadings
- [x] Implementar upload de imágenes — **resuelto sin esperar credenciales GCS**: `POST /api/media/upload` (multer + validación por magic bytes, no por MIME/extensión declarados) contra `LocalDiskStorageProvider` detrás de una interfaz `StorageProvider` (ADR-007 en `ARCHITECTURE.md`); GCS se conecta después implementando la misma interfaz, sin tocar controller/service. Probado con `curl` real: sube un PNG, devuelve URL, la URL sirve el archivo (200)
- [x] Módulo `stats` — `GET /api/stats/dashboard` con métricas agregadas (lecturas/preguntas/estudiantes/intentos/top lecturas), probado con `curl` real contra datos sembrados
- [x] **QA gate:** lint 0 errores, build backend + admin limpios, 349/349 tests pasan (211 backend + 138 admin), cobertura configurada con thresholds (backend 75.5% stmts, admin 95.8% stmts) — verificado corriendo los comandos directamente y con scripts `pnpm check`
- [x] **🎯 Demo #1: API funcional end-to-end** — verificado con `curl` contra Postgres real: registro, login, `GET /readings`, `POST /progress/submit` (score 5/5, points, level-up), `GET /progress/me`, `GET /stats/dashboard`, `POST /media/upload` — todo correcto

### Sprint 3 — Panel de Admin (Semana 5–6)
- [x] Inicializar proyecto React + Vite (`admin/`, build y type-check verificados)
- [x] Configurar React Router, Zustand, TanStack Query
- [x] Crear layout base (sidebar, header, contenido)
- [x] Pantalla de login admin (React Hook Form + Zod, redirige si el rol no es ADMIN)
- [x] API client con refresh automático de token en 401
- [x] Dashboard con métricas reales (`useDashboardStats` + gráficas con Recharts: lecturas por estado, estudiantes por nivel, top lecturas)
- [x] CRUD visual de lecturas — listado, creación y **edición** (`ReadingFormModal` en modo create/edit), publicar/archivar
- [x] CRUD visual de preguntas (`QuestionsPage` por lectura — crear, editar, eliminar, tipo MULTIPLE_CHOICE/TRUE_FALSE)
- [x] Preview de lectura (`ReadingPreviewPage` — oculta correctAnswer/explanation/status igual que ve un estudiante)
- [x] Flujo de revisión de preguntas IA (DRAFT → APPROVED) — `ApprovalProgress` + botón aprobar por pregunta
- [x] Tests de componentes (Vitest + Testing Library configurado, 109 tests)
- [x] **🎯 Demo #2: Admin puede subir una lectura completa** — flujo completo (crear lectura → agregar preguntas → aprobar → publicar) implementado y cubierto por 109 tests; además verificado con ambos `pnpm dev` corriendo a la vez (backend real + admin) y `curl` pasando por el proxy `/api` de Vite tal como lo haría el navegador (login OK, ruta protegida sin token → 401 correctamente)

### Sprint 4 — App Móvil MVP (Semana 7–8)
- [x] Inicializar proyecto React Native Expo (`mobile/`)
- [x] Configurar tema, fuentes, contraste y diseño accesible (`mobile/src/theme/`)
- [x] Configurar HTTP client con interceptors, token refresh y error handling (`mobile/src/api/`)
- [x] Pantallas de autenticación: Login y Registro con validación y manejo de errores
- [x] Pantalla de mapa/ruta de aprendizaje con selector de niveles pedagógicos
- [x] Pantalla de lectura con tipografía optimizada y navegación fluida
- [x] Pantalla de cuestionario con progreso interactivo, feedback inmediato y level-up
- [x] Pantalla de perfil de estudiante (progreso por nivel, puntos, racha, logout)
- [x] Navegación completa (Stack + Tabs) con deep linking (`RootNavigator`)
- [x] Suite de tests completa: 8 suites, 59 tests pasando (contrato API, clientes HTTP, UI y pantallas)
- [x] **🎯 Demo #3: Estudiante completa un reto end-to-end**

### Sprint 5 — Progreso y Pulimiento (Semana 9–10)
- [ ] Implementar módulo `progress` en backend
- [ ] Tracking de intentos (cada quiz attempt se guarda)
- [ ] Lógica de desbloqueo de niveles
- [ ] Barra de progreso por nivel de comprensión
- [ ] Caché offline de lecturas (SQLite)
- [ ] Optimización de rendimiento (gama baja)
- [ ] Testing en dispositivos reales
- [ ] Fix de bugs encontrados en demos
- [ ] **🎯 Demo #4: MVP completo funcional**

---

## Fase 2: IA y Editorial (Octubre – Noviembre 2026)

- [ ] Integrar Google Gemini API
- [ ] Diseñar prompts para generación por nivel (Literal/Inferencial/Crítico)
- [ ] Implementar cola de jobs (BullMQ)
- [ ] Endpoint: admin sube texto → IA genera preguntas (async)
- [ ] UI: botón "Generar con IA" en el editor de lecturas
- [ ] Flujo de revisión editorial (draft → review → approve)
- [ ] Dashboard de métricas mejorado
- [ ] Reportes básicos (lecturas más completadas, puntajes promedio)

---

## Fase 3: Gamificación Avanzada (Diciembre 2026 – Enero 2027)

- [ ] Sistema de puntos (puntos por completar, rachas, bonus)
- [ ] Avatar personalizable (base + accesorios)
- [ ] Tienda de accesorios (comprar con puntos)
- [ ] Leaderboard nacional (Top 10 + posición)
- [ ] Animaciones de celebración (Lottie)
- [ ] Notificaciones push (rachas, nuevas lecturas)

---

## 🚫 Bloqueados

| Item | Razón | Acción requerida |
|------|-------|-----------------|
| Definir hosting | Presupuesto no confirmado | Reunión con el cliente |
| Generación de preguntas IA | Prompt engineering pendiente | Diseñar prompts con el cliente |
| Privacidad de datos de menores | Lineamientos MINEDUC no consultados | Investigar regulaciones Guatemala |

---

## 🔍 Deuda técnica encontrada en la auditoría de alineación docs↔código

Ninguno de estos bloquea nada — son gaps reales encontrados cruzando cada doc contra el código real, no bugs funcionales. Quedaron documentados con su estado real (✅/🔲/⚠️) en `TECHSTACK.md`, `ARCHITECTURE.md` y `CLAUDE.md` en vez de quedar silenciados.

- [x] **Sanitización de HTML** — implementada. `sanitizePlainText` (`backend/src/shared/utils/sanitize-html.ts`, sobre `sanitize-html`) se llama desde `reading.service.ts`/`question.service.ts` en `create`/`update`, y despoja todas las etiquetas de `reading.title`/`content` y `question.statement`/`explanation`/`options[].text` antes de persistir. 11 tests nuevos (140 backend en total). Ver `ARCHITECTURE.md` → Registro de Riesgos, R-04 (resuelto, con nota del riesgo residual si se agrega un editor rich-text)
- [ ] **CI/CD no configurado** — no hay `.github/workflows/`, pese a que ya existen 249 tests (140 backend + 109 admin) que deberían gatillar en cada PR. `TECHSTACK.md` ya listaba GitHub Actions como decisión, nunca se implementó
- [ ] **`husky` + `lint-staged` no instalados** — ningún hook corre antes de commit/push hoy
- [x] **Dependencias instaladas sin uso real** — resuelto quitándolas: `@faker-js/faker` (backend) y `date-fns` (admin) removidas de `package.json` vía `pnpm install`; cero referencias reales en el código, confirmado con grep antes de quitarlas
- [x] **`multer` en `TECHSTACK.md` decía `^1.4`, la versión real instalada es `2.2.0`** (ya corregido en el doc — multer 1→2 es un cambio de API, no un patch trivial, vale la pena tenerlo en cuenta si se toca `upload.middleware.ts`)

---

## 📝 Notas

- El expediente de propuesta financiera se entrega el **jueves 9**
- El primer entregable visible para el cliente es en **septiembre**
- Priorizar Android — iOS es futuro no confirmado
- El cliente mencionó gamificación avanzada como "adicional" — no es P0
- **Postgres local de desarrollo:** contenedor Docker `lectoapp-postgres` (imagen `postgres:16`, puerto host **5433**, no 5432 — ese puerto lo ocupa un Postgres nativo de Windows ya instalado en esta máquina). Credenciales y `DATABASE_URL` en `backend/.env` (no versionado). Levantar con `docker start lectoapp-postgres` si está detenido.
- Se encontraron y corrigieron secciones duplicadas de Media/Stats en `docs/api-reference.md` (dos pasadas del pipeline documentaron los mismos endpoints por separado) — quedó una sola versión (la más precisa) y renumerada.
- **Auditoría completa de alineación docs↔código** (Agosto 2026): se cruzó cada afirmación de `TECHSTACK.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `.agents/AGENTS.md` y `CONVENTIONS.md` contra el código real (`package.json`, `schema.prisma`, validators, servicios). Se corrigieron ~20 inconsistencias reales — no solo redacción, cosas verificables como versión incorrecta de `multer`, campos `deletedAt`/`updatedAt` asumidos en modelos que no los tienen, referencias cruzadas rotas entre `api-reference.md` y el código (`§6`→`§7` de Media), un ejemplo de React en `CONVENTIONS.md` desactualizado respecto al componente real, y la regla "comentarios en inglés" que ningún archivo real sigue. Ver la sección de Deuda Técnica arriba para lo que quedó pendiente de *código* (no de documentación) tras esta pasada.
- Pendientes menores de pulido, no bloqueantes: el bundle de producción del admin pasa de 500KB (Recharts es el grueso — candidato a code-splitting/`import()` dinámico más adelante), y esta máquina corre Node 24 en vez del 20.x LTS que pide `TECHSTACK.md` (funciona igual, pero conviene alinear antes de desplegar a producción).
- Sigue pendiente el clic manual en navegador real (Chrome/Firefox) del flujo completo — lo verificado es `curl` a través del proxy de Vite, que prueba la integración real pero no la UI visualmente.
- **Cierre de deuda técnica (Agosto 2026):** de los 4 ítems que quedaron pendientes tras la auditoría, se cerraron 2 — sanitización de HTML (`sanitize-html` real, no solo el gap documentado) y las dependencias sin uso (`@faker-js/faker`, `date-fns`, removidas). CI/CD y husky/lint-staged siguen sin decisión — son configuración de tooling, no código de producto, y quedan a criterio del equipo sobre cuándo vale la pena el setup.

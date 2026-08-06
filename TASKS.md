# TASKS.md — LectoApp Estado del Proyecto

**Última actualización:** Agosto 2026  
**Fase actual:** Pre-desarrollo (Discovery y Arquitectura)

---

## Estado General

```
██░░░░░░░░░░░░░░░░░░ 10% — Discovery y documentación
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

### 📋 Pendiente
- [ ] Reunión de dimensionamiento con el cliente (martes)
- [ ] Validar stack tecnológico con el cliente
- [ ] Definir plataformas (¿solo Android o Android + iOS?)
- [ ] Definir hosting y presupuesto operativo
- [ ] Expediente de propuesta financiera (entrega: jueves 9)
- [ ] Setup del repositorio Git
- [ ] Inicializar proyectos (backend, admin, mobile)

---

## Fase 1: MVP (Agosto – Septiembre 2026)

### Sprint 1 — Backend Core (Semana 1–2)
- [ ] Inicializar proyecto Node.js + TypeScript
- [ ] Configurar Express + middleware (cors, helmet, morgan, rate-limit)
- [ ] Configurar Prisma + PostgreSQL
- [ ] Crear schema de Prisma (todas las entidades)
- [ ] Ejecutar primera migración
- [ ] Implementar sistema de errores personalizados
- [ ] Implementar middleware de validación (Zod)
- [ ] Implementar módulo `auth` (registro, login, refresh token)
- [ ] Implementar middleware de autenticación JWT
- [ ] Implementar middleware de autorización por roles
- [ ] Seed de datos iniciales (admin default, lecturas de ejemplo)
- [ ] Tests unitarios del módulo auth

### Sprint 2 — Content Management (Semana 3–4)
- [ ] Implementar módulo `readings` (CRUD completo)
- [ ] Implementar módulo `questions` (CRUD, asociación a lecturas)
- [ ] Implementar upload de imágenes (multer + Cloud Storage)
- [ ] Implementar estados de lectura (draft → published → archived)
- [ ] Validación: mínimo 5 preguntas para publicar
- [ ] Tests unitarios de readings y questions
- [ ] **🎯 Demo #1: API funcional con Postman/Insomnia**

### Sprint 3 — Panel de Admin (Semana 5–6)
- [ ] Inicializar proyecto React + Vite
- [ ] Configurar React Router, Zustand, TanStack Query
- [ ] Crear layout base (sidebar, header, contenido)
- [ ] Pantalla de login admin
- [ ] Dashboard con métricas básicas
- [ ] CRUD visual de lecturas (tabla + formulario + editor)
- [ ] CRUD visual de preguntas (asociadas a cada lectura)
- [ ] Preview de lectura (cómo se ve en la app)
- [ ] Gestión de estados (publicar, archivar, restaurar)
- [ ] Tests básicos de componentes
- [ ] **🎯 Demo #2: Admin puede subir una lectura completa**

### Sprint 4 — App Móvil MVP (Semana 7–8)
- [ ] Inicializar proyecto Flutter
- [ ] Configurar tema, fuentes, colores
- [ ] Configurar Dio + interceptors de auth
- [ ] Pantalla de login/registro
- [ ] Selección de avatar inicial
- [ ] Pantalla de mapa/ruta de aprendizaje
- [ ] Pantalla de lectura (scroll, tipografía legible)
- [ ] Pantalla de cuestionario (pregunta por pregunta)
- [ ] Pantalla de resultados (puntaje + explicaciones)
- [ ] Perfil del estudiante (progreso, estadísticas)
- [ ] Navegación entre pantallas (GoRouter)
- [ ] **🎯 Demo #3: Estudiante completa un reto end-to-end**

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

## 📝 Notas

- El expediente de propuesta financiera se entrega el **jueves 9**
- El primer entregable visible para el cliente es en **septiembre**
- Priorizar Android — iOS es futuro no confirmado
- El cliente mencionó gamificación avanzada como "adicional" — no es P0

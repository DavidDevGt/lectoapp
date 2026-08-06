# LectoApp — Antigravity Workspace Rules

> Reglas específicas para el agente Antigravity en este workspace.

## Idioma
- Responder siempre en español
- Comentarios de código en inglés
- Mensajes de error de la API en español (user-facing)
- Logs del servidor en inglés

## Comportamiento
- Consultar CLAUDE.md y PRD.md antes de cualquier implementación
- Seguir estrictamente los patrones definidos en CONVENTIONS.md
- No usar librerías listadas como prohibidas en TECHSTACK.md
- Actualizar TASKS.md al completar tareas
- Crear tests para todo código nuevo en módulos backend

## Prioridades del proyecto
1. Panel de administración funcional (el cliente lo necesita para validar)
2. API REST robusta con validación
3. App móvil que funcione en Android gama baja
4. Rendimiento > features extras

## Restricciones técnicas
- TypeScript estricto (no `any`)
- Prisma como único ORM
- Zod para validación
- Express para HTTP
- Formato de respuesta: `{ success, data, error, meta? }`
- Soft delete con `deletedAt` en todas las entidades

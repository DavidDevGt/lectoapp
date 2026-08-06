# PRD — LectoApp: Comprensión Lectora Gamificada

**Documento:** Product Requirements Document (PRD)  
**Versión:** 1.0  
**Autor:** Solutions Architecture Team  
**Cliente:** Giovanni — Sector Educativo, Guatemala  
**Fecha:** Agosto 2026  
**Estado:** En validación con el cliente

---

## 1. Resumen Ejecutivo

LectoApp es una plataforma educativa móvil gamificada diseñada para mejorar la comprensión lectora de estudiantes en Guatemala. Su diferenciador clave es un **sistema de gestión de contenido (CMS) integrado** que otorga al cliente autonomía editorial total para crear, editar y clasificar lecturas y cuestionarios sin depender de terceros.

El sistema incluye generación automática de preguntas mediante inteligencia artificial (Gemini API), una ruta de aprendizaje progresiva con cinco niveles, y elementos de gamificación (puntos, avatares, leaderboard) para mantener la motivación del estudiante.

---

## 2. Problema y Contexto

### 2.1 Situación actual
El cliente lidera una estrategia nacional para mejorar la comprensión lectora. Actualmente produce materiales en formato impreso y ha evaluado alternativas digitales sin éxito:

| Alternativa evaluada | Resultado | Razón del rechazo |
|---------------------|-----------|-------------------|
| Curso virtual tradicional | Descartado | Funcionalidad limitada, no interactivo |
| Apps existentes del mercado | Descartado | Contenido cerrado — imposible gestionar lecturas propias |

### 2.2 Dolor principal
**Dependencia total de terceros para gestionar contenido educativo.** El cliente necesita subir, editar y clasificar sus propias lecturas sin intermediarios.

### 2.3 Por qué esto importa
Guatemala tiene necesidades específicas de comprensión lectora que no están cubiertas por apps genéricas internacionales. El contenido debe ser culturalmente relevante, actualizable en tiempo real, y clasificado según los tres niveles pedagógicos de comprensión que el cliente utiliza en su estrategia nacional.

---

## 3. Usuarios

### 3.1 Personas

#### Persona 1: El Estudiante
- **Quién:** Estudiante guatemalteco (primaria/secundaria)
- **Dispositivo:** Android gama baja-media, conectividad irregular
- **Motivación:** Aprender mientras juega, avanzar en niveles, competir con compañeros
- **Frustración:** Apps aburridas, textos irrelevantes, interfaces lentas
- **Necesidad:** Experiencia fluida, contenido relevante, progreso visible

#### Persona 2: El Administrador (Giovanni y su equipo)
- **Quién:** Profesional educativo con conocimiento básico de tecnología
- **Dispositivo:** Computadora de escritorio/laptop, conexión estable
- **Motivación:** Publicar contenido rápidamente, medir impacto
- **Frustración:** Depender de desarrolladores para cambiar una lectura
- **Necesidad:** Panel simple donde pueda subir lecturas y ver métricas

---

## 4. Alcance y Fasing

### Fase 1 — MVP (Agosto – Septiembre 2026)

| ID | Feature | Descripción | Prioridad |
|----|---------|-------------|-----------|
| F1 | Autenticación | Login/registro con email. Roles: estudiante, admin | P0 |
| F2 | Panel de administración | CRUD de lecturas y preguntas. Clasificación por nivel | P0 |
| F3 | Ruta de aprendizaje | Mapa de progresión visual por niveles | P0 |
| F4 | Lecturas y cuestionarios | Flujo: leer texto → responder preguntas → ver resultado | P0 |
| F5 | Progreso del estudiante | % de avance por nivel de comprensión (Literal, Inferencial, Crítico) | P0 |
| F6 | Perfil del estudiante | Avatar básico + visualización de estadísticas | P1 |

### Fase 2 — IA y Editorial (Octubre – Noviembre 2026)

| ID | Feature | Descripción | Prioridad |
|----|---------|-------------|-----------|
| F7 | Generación de preguntas con IA | Admin sube texto + nivel → IA genera cuestionario automáticamente | P1 |
| F8 | Flujo de revisión editorial | Admin revisa/edita preguntas generadas antes de publicar | P1 |
| F9 | Métricas y reportes | Dashboard con estadísticas de uso y rendimiento por lectura | P2 |

### Fase 3 — Gamificación Avanzada (Diciembre 2026 – Enero 2027)

| ID | Feature | Descripción | Prioridad |
|----|---------|-------------|-----------|
| F10 | Sistema de puntos | Puntos por completar retos, rachas, bonus | P2 |
| F11 | Tienda de avatar | Comprar accesorios para el avatar con puntos ganados | P2 |
| F12 | Leaderboard nacional | Ranking Top 10 + posición del estudiante | P2 |

---

## 5. Especificación Funcional Detallada (Fase 1)

### F1: Autenticación

**Flujo de registro (estudiante):**
1. Pantalla de bienvenida → botón "Crear cuenta"
2. Formulario: nombre, email, contraseña, grado escolar
3. Validación de email único
4. Creación de cuenta → redirect a selección de avatar inicial
5. Login automático post-registro

**Flujo de login:**
1. Email + contraseña
2. Validación → JWT (access token 15min + refresh token 7 días)
3. Redirect según rol: estudiante → mapa | admin → dashboard

**Reglas:**
- Contraseña mínima: 8 caracteres
- Máximo 5 intentos fallidos → bloqueo temporal de 15 minutos
- Refresh token rotation (cada uso del refresh token genera uno nuevo)

---

### F2: Panel de Administración

**CRUD de Lecturas:**
- Crear lectura: título, contenido (texto largo), nivel de comprensión (Literal/Inferencial/Crítico), nivel de progresión (Principiante–Supremo), imagen de portada (opcional)
- Editar lectura existente
- Archivar lectura (soft delete — no se muestra al estudiante pero no se pierde)
- Listar lecturas con filtros por nivel y estado (borrador/publicada/archivada)
- Preview de cómo se verá en la app móvil

**CRUD de Preguntas:**
- Asociadas a una lectura específica
- Campos: enunciado, 4 opciones de respuesta, respuesta correcta, explicación de la respuesta
- Tipo: opción múltiple (Fase 1), verdadero/falso (Fase 1)
- Mínimo 5 preguntas **aprobadas** (`status: APPROVED`) por lectura para que se pueda publicar. Las preguntas generadas por IA nacen en `DRAFT` y no cuentan hasta que el admin las revisa y aprueba (ver F8)
- El campo `order` de cada pregunta define el orden en que el admin las edita/visualiza en el panel. **De cara al estudiante, el orden de presentación siempre se mezcla aleatoriamente en cada intento** (ver F4) — no existe un modo "orden fijo" para el estudiante

**Estados de una lectura:**
```
Borrador → Publicada → Archivada
              ↑            |
              +------------+
           (se puede restaurar)
```

---

### F3: Ruta de Aprendizaje

**Concepto visual:**
Un mapa estilo "camino" (inspirado en Duolingo) donde cada nodo es un reto.

**Estructura:**
```
Nivel 1: Principiante
  ├── Reto 1.1 (Lectura + quiz) ← desbloqueado
  ├── Reto 1.2 ← se desbloquea al completar 1.1
  ├── Reto 1.3
  └── Boss 1 (evaluación de nivel)
Nivel 2: Intermedio
  ├── Reto 2.1 ← se desbloquea al pasar Boss 1
  ├── ...
```

**Reglas de progresión:**
- Los retos se desbloquean secuencialmente dentro de cada nivel
- Para avanzar de nivel, el estudiante debe completar TODOS los retos del nivel actual
- Un reto se considera completado con ≥70% de respuestas correctas
- Se puede re-intentar un reto ilimitadamente
- Las preguntas se mezclan aleatoriamente en cada intento

---

### F4: Lecturas y Cuestionarios

**Flujo del estudiante:**
1. Toca un reto en el mapa → se abre la lectura
2. Lee el texto completo (scroll, tipografía legible)
3. Al terminar de leer, botón "Comenzar cuestionario"
4. Preguntas una por una (no se puede volver atrás)
5. Al completar → pantalla de resultados:
   - Puntaje (ej: 8/10)
   - Respuestas correctas e incorrectas con explicación
   - Puntos ganados
   - Botón "Siguiente reto" o "Reintentar"

**Reglas:**
- Timer opcional por pregunta (configurable por admin, default: sin timer)
- No se puede saltar preguntas
- Se almacena cada intento (fecha, respuestas, puntaje)
- Se muestra el mejor intento en el perfil

---

### F5: Progreso del Estudiante

**Métricas visibles para el estudiante:**
- % de avance general (total de retos completados / total disponibles)
- % de avance por nivel de comprensión:
  - Literal: X%
  - Inferencial: X%
  - Crítico: X%
- Racha actual (días consecutivos de uso)
- Total de puntos acumulados
- Posición en leaderboard (placeholder Fase 1)

---

## 6. Requerimientos No Funcionales

| Categoría | Requerimiento | Métrica |
|-----------|--------------|---------|
| **Performance** | Tiempo de carga de lectura | < 2 segundos en 3G |
| **Performance** | Tiempo de respuesta API | < 500ms (p95) |
| **Disponibilidad** | Uptime | 99.5% mensual |
| **Escalabilidad** | Usuarios concurrentes (Fase 1) | Hasta 5,000 |
| **Escalabilidad** | Usuarios totales (año 1) | Hasta 50,000 |
| **Dispositivos** | Android mínimo | Android 8.0 (API 26) |
| **Dispositivos** | RAM mínima | 2 GB |
| **Tamaño** | APK size | < 30 MB |
| **Offline** | Caché de lecturas ya descargadas | Lectura disponible offline |
| **Seguridad** | Datos de menores | Cumplir lineamientos de privacidad del MINEDUC |
| **Idioma** | Interfaz | Español (Guatemala) |

---

## 7. Métricas de Éxito

| Métrica | Objetivo | Cómo se mide |
|---------|----------|--------------|
| Admin sube una lectura completa | < 5 minutos | Cronómetro en UX test |
| Estudiante completa un reto | < 10 minutos | Promedio en BD |
| Retención semanal | > 40% | Usuarios activos semana N / registros |
| Aprobación de cuestionarios | > 60% al primer intento | Promedio en BD |
| App rating | > 4.0 estrellas | Play Store |
| Crash rate | < 1% | Firebase Crashlytics |

---

## 8. Restricciones

| Restricción | Detalle |
|-------------|---------|
| **Presupuesto** | Pagos mensuales por entregable — atados a ciclos cuatrimestrales |
| **Primer entregable** | Septiembre 2026 (funcional o demo) |
| **Plataforma primaria** | Android (iOS es nice-to-have futuro) |
| **Conectividad** | Diseñar para conectividad heterogénea |
| **Dispositivos** | Funcionar en gama baja (2GB RAM, pantallas 5") |
| **Hosting** | A definir con el cliente — presupuesto operativo limitado |

---

## 9. Fuera de Alcance (Fase 1)

- ❌ Versión iOS
- ❌ Versión web para estudiantes
- ❌ Integración con sistemas escolares (SIE/MINEDUC)
- ❌ Chat o foro entre estudiantes
- ❌ Notificaciones push avanzadas
- ❌ Modo multijugador
- ❌ Lecturas con audio/multimedia
- ❌ Reportes exportables (PDF/Excel)

---

## 10. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Scope creep del cliente | Alta | Alto | Contrato de entregables por fase, cambios se cotizan aparte |
| Conectividad de estudiantes | Alta | Medio | Caché offline, assets optimizados, app liviana |
| Presupuesto insuficiente | Media | Alto | Fasing estricto, MVP primero, features premium en fases posteriores |
| API de IA con rate limits | Media | Medio | Cola de generación, fallback manual, caché de preguntas |
| Dispositivos muy antiguos | Media | Medio | Android 8+ como mínimo, testing en gama baja |
| Adopción baja de estudiantes | Media | Alto | Gamificación, UX atractiva, onboarding guiado |

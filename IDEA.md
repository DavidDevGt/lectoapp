# Brief del Cliente — App de Comprensión Lectora Gamificada

**Cliente:** Giovanni (sector educativo, Guatemala)
**Fecha de reunión:** Levantamiento inicial de requerimientos
**Estado:** Pendiente de dimensionamiento y propuesta financiera

---

## 1. Contexto y problema

El cliente lidera una estrategia nacional para mejorar la **comprensión lectora de estudiantes**. Ya produce materiales en formato impreso y evaluó dos alternativas digitales antes de llegar a esta solicitud:

1. **Curso virtual** — descartado por limitado.
2. **Apps existentes en el mercado** — descartadas porque el contenido viene cerrado dentro de la app: no puede agregar, modificar ni corregir lecturas.

**Dolor principal:** dependencia total de terceros para gestionar contenido. El cliente necesita autonomía editorial.

---

## 2. Producto solicitado

Aplicación móvil educativa gamificada, con backend administrable por el cliente.

### 2.1 Funcionalidades core

| # | Funcionalidad | Descripción |
|---|--------------|-------------|
| 1 | **Autenticación** | Login del estudiante con correo electrónico |
| 2 | **Ruta de aprendizaje** | Mapa de progresión por niveles (Principiante → Supremo). Cada nodo = un reto (lectura + cuestionario) |
| 3 | **Lecturas y cuestionarios** | El estudiante lee un texto y responde preguntas para avanzar de nivel |
| 4 | **Perfil del estudiante** | Avatar personalizable + visualización de avances |
| 5 | **Progreso por nivel de comprensión** | Porcentaje de avance en cada uno de los 3 niveles: **Literal**, **Inferencial** y **Crítico** |

### 2.2 Gestión de contenido (requerimiento crítico)

- Las lecturas y preguntas viven en un **servidor**, no dentro de la app.
- El cliente debe poder **agregar, editar y clasificar lecturas** por nivel de comprensión (literal / inferencial / crítico) desde un panel de administración.
- Este punto es la razón por la que descartó soluciones existentes. **No es negociable.**

### 2.3 Generación de preguntas con IA

- El cliente sube el texto de la lectura + indica el nivel de comprensión.
- El sistema genera automáticamente el cuestionario correspondiente.
- Alternativa manual (agregar preguntas una por una) aceptada como fallback, pero la IA es lo deseado.

### 2.4 Gamificación

- **Puntos** por completar retos.
- **Tienda de accesorios**: los puntos permiten comprar ítems para equipar el avatar (el avatar inicia básico y evoluciona).
- **Leaderboard nacional**: ranking de estudiantes con Top 10 y punteo visible.

> Nota del cliente: la gamificación avanzada (tienda, leaderboard) la mencionó como "adicional" — candidata natural a fase 2.

---

## 3. Alcance y escala

- Lanzamiento previsto **a nivel nacional** (Guatemala).
- Implicaciones: volumen de usuarios estudiantil, dispositivos de gama variada, conectividad heterogénea.

---

## 4. Modalidad de contratación

| Vía | Implicación |
|-----|-------------|
| **Empresa** | Requiere publicar el evento; el cliente no puede comprometer fondos hasta el **tercer cuatrimestre** (evento se subiría en septiembre) |
| **Consultor individual** | Puede **iniciar de inmediato**, con entregables y pagos mensuales definidos |

**Restricción de flujo:** el presupuesto está atado a ciclos cuatrimestrales — si un pago cae fuera del cuatrimestre, no puede ejecutarse. Los **entregables mensuales con montos fijos** son requisito para que el cliente pueda programar pagos.

**Presupuesto:** no revelado en la reunión.

---

## 5. Cronograma acordado

| Hito | Fecha |
|------|-------|
| Reunión de dimensionamiento (con el consultor que desarrollaría) | Martes próximo |
| Entrega de expediente: propuesta financiera + entregables + tiempos | **Jueves 9** (el cliente lo entrega internamente el 10) |
| Inicio de desarrollo | Agosto |
| Primer producto/entregable | Septiembre |

---

## 6. Entregable esperado del proveedor

Un **expediente** que contenga:

1. Dimensionamiento del proyecto
2. Lista de entregables por mes
3. Tiempos de cada entregable
4. Monto total y calendario de pagos

---

## 7. Preguntas abiertas (para la reunión de dimensionamiento)

- ¿Plataformas objetivo? (Android solamente vs. Android + iOS — por el contexto, Android probablemente domina)
- ¿Cuántos estudiantes estimados en el lanzamiento? ¿Nacional desde el día 1 o piloto?
- ¿Quién administra usuarios/estudiantes? ¿Registro libre o por institución?
- ¿Requisitos de privacidad de datos de menores?
- ¿El "primer producto" de septiembre debe ser funcional (MVP) o puede ser diseño + prototipo?
- ¿Hosting: quién lo paga y opera después de la entrega?
- ¿La IA de generación de preguntas necesita revisión humana antes de publicar?

---

## 8. Recomendación de fasing (propuesta)

**Fase 1 — MVP (agosto–septiembre):** login, ruta de aprendizaje, lecturas + cuestionarios, progreso por los 3 niveles, panel de administración de contenido.

**Fase 2:** generación de preguntas con IA + revisión editorial.

**Fase 3:** tienda de avatar, puntos avanzados, leaderboard nacional.
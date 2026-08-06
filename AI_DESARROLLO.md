# Metodología de Desarrollo Asistido por IA
### Cómo trabajar hoy para entregar exactamente lo que el cliente necesita

**Versión:** 1.0  
**Proyecto de referencia:** App de Comprensión Lectora — Giovanni (Guatemala)  
**Fecha:** Agosto 2026

---

## 🧭 El cambio de paradigma: de "coder" a "arquitecto de soluciones"

Con la IA disponible hoy (Copilot, Cursor, Gemini, Claude, ChatGPT), el trabajo del desarrollador **no desaparece — se eleva**. Ya no se trata de recordar sintaxis ni escribir boilerplate. Ahora el valor está en:

> **Saber qué construir, por qué, en qué orden, y cómo validarlo con el cliente.**

El desarrollador que ignora las herramientas de IA en 2026 compite en desventaja de tiempo. El que las usa sin criterio entrega software rápido pero equivocado. El que las combina con metodología entrega **exactamente lo que el cliente necesita, en menos tiempo**.

---

## 1. Antes de escribir una sola línea de código

### 1.1 Levantamiento profundo de requerimientos (el paso que la IA no puede hacer por ti)

La IA puede generar código en segundos. No puede sentarse con Giovanni y entender **qué lo frustra realmente**. Este paso es 100% humano y es el más crítico.

**Checklist de levantamiento:**

- [ ] ¿Cuál es el dolor actual del cliente? *(no el síntoma — el dolor raíz)*
- [ ] ¿Qué ha intentado antes y por qué falló?
- [ ] ¿Quiénes son los usuarios finales reales? *(no solo el cliente que paga)*
- [ ] ¿Cuál es el caso de uso principal, el que si falla, todo falla?
- [ ] ¿Qué es "éxito" para el cliente en 90 días?
- [ ] ¿Qué restricciones existen que el cliente no menciona explícitamente? *(presupuesto, infraestructura, legal)*

**Regla de oro:** Si el cliente dice *"quiero una app"*, tu trabajo es descubrir que lo que realmente quiere es *"que mis estudiantes mejoren su comprensión lectora"*. La app es un medio, no el fin.

---

### 1.2 Documentación estructurada del requerimiento

Antes de cualquier arquitectura o código, produce un documento de requerimiento que incluya:

```
CONTEXTO:       ¿Qué problema existe hoy en el mundo del cliente?
SOLUCIÓN:       ¿Qué construiremos y por qué eso resuelve el problema?
USUARIOS:       ¿Quiénes van a usar esto? ¿Cuáles son sus contextos reales?
ÉXITO:          ¿Cómo medimos que funciona?
NO-ALCANCE:     ¿Qué NO vamos a hacer (y por qué)?
RIESGOS:        ¿Qué puede salir mal?
```

> **Tip con IA:** Una vez tienes tus notas del levantamiento, puedes pedirle a Claude/ChatGPT que te ayude a estructurar y redactar el documento de requerimientos. Pero los *inputs* (las notas, las respuestas del cliente) deben ser tuyas.

---

## 2. Arquitectura primero — código después

### 2.1 Diseña la arquitectura en papel antes de abrir el IDE

La IA puede generar código de cualquier arquitectura. Por eso, si no defines la arquitectura primero, terminas con código que "funciona" pero que es un laberinto de deuda técnica.

**Para este proyecto (app educativa gamificada), la arquitectura mínima a definir:**

```
+--------------------------------------------------+
|                    CLIENTES                      |
|  [App Móvil - Estudiante]  [Panel Admin - Admin] |
+-------------------+------------------+-----------+
                    |                  |
                    v                  v
+--------------------------------------------------+
|               API REST / GraphQL                 |
|           (Backend — Node/Django/etc.)           |
+----------------------+---------------------------+
                       |
         +-------------+-------------+
         v             v             v
    [Base de       [Storage      [Servicio IA
     Datos]         Archivos]     Preguntas]
```

**Preguntas que debes responder antes de abrir el IDE:**

- ¿Qué tipo de base de datos? *(relacional = PostgreSQL, documental = MongoDB)*
- ¿Quién hostea? ¿Heroku, Railway, VPS, AWS?
- ¿App nativa, híbrida o PWA?
- ¿REST o GraphQL?
- ¿Cómo se autentica? *(JWT, sesiones, OAuth)*

---

### 2.2 Usa la IA para validar tu arquitectura, no para inventarla

Una vez tienes tu propuesta, puedes hacer esto:

```
Prompt ejemplo:
"Tengo una app educativa móvil con estos requerimientos: [lista].
El backend es Node.js + PostgreSQL. La app es Flutter.
¿Qué problemas de escalabilidad o seguridad ves en esta arquitectura
para un contexto de 10,000 estudiantes en Guatemala con conectividad irregular?"
```

La IA actuará como un revisor de arquitectura. No la uses para que *diseñe* — úsala para que *critique*.

---

## 3. El flujo de trabajo diario con IA

### 3.1 El ciclo de 4 pasos

```
ENTENDER  →  DISEÑAR  →  GENERAR  →  VALIDAR
  (tú)         (tú)       (IA+tú)      (tú)
```

Nunca omitas el primer y último paso. Son exclusivamente humanos.

---

### 3.2 Cómo usar la IA en cada fase del desarrollo

#### 🏗️ Fase de Setup

| Tarea | Cómo usar la IA |
|-------|-----------------|
| Crear estructura de proyecto | `"Crea la estructura de carpetas para una API REST en Node.js con Express, JWT y PostgreSQL"` |
| Configurar ESLint, prettier, etc. | Pídele los archivos de configuración base |
| Dockerfile / docker-compose | Descríbele tu stack y que genere el compose |
| Variables de entorno | Pídele el `.env.example` dado tu arquitectura |

#### ✍️ Fase de Desarrollo

| Tarea | Cómo usar la IA |
|-------|-----------------|
| Modelos de base de datos | Descríbele las entidades con sus relaciones y pídele el schema |
| Endpoints CRUD | Dile la entidad, los campos, y el comportamiento esperado |
| Validaciones | Pídele que agregue validación robusta con mensajes claros |
| Lógica de negocio compleja | Explícale la regla de negocio en lenguaje natural |
| Tests unitarios | Pídele que genere los tests después de escribir la función |

#### 🎨 Fase de UI/UX

| Tarea | Cómo usar la IA |
|-------|-----------------|
| Componentes base | Descríbele el componente con su comportamiento y estados |
| Diseño de pantallas | Usa herramientas como v0.dev o Bolt para prototipos rápidos |
| Animaciones | Pídele animaciones específicas (Framer Motion, Lottie) |
| Responsive | Que revise tu CSS/layout para distintos breakpoints |

#### 🔍 Fase de Debug

| Tarea | Cómo usar la IA |
|-------|-----------------|
| Error incomprensible | Pega el stack trace completo + contexto del código |
| Código lento | Pídele análisis de performance y alternativas |
| Comportamiento inesperado | Describe el comportamiento actual vs. el esperado |

---

### 3.3 Las reglas de oro al usar IA en código

1. **Nunca copies código sin leerlo.** La IA puede generar código que compila pero que tiene vulnerabilidades de seguridad, lógica incorrecta, o asunciones equivocadas sobre tu dominio.

2. **Sé específico en el contexto.** Un prompt vago produce código genérico. Un prompt con contexto produce código útil.
   - ❌ `"Crea el login"`
   - ✅ `"Crea el endpoint POST /auth/login en Express con JWT de 7 días, que valide email y password contra PostgreSQL usando bcrypt, y devuelva el token + datos básicos del usuario. El usuario puede ser estudiante o administrador."`

3. **Una tarea a la vez.** No le pidas a la IA que construya todo el módulo de una vez. Construye incrementalmente y valida en cada paso.

4. **Tú eres responsable del código.** Si la IA genera algo incorrecto y lo entregas, es tu error, no de la IA. Valida siempre.

5. **Usa la IA para aprender, no solo para copiar.** Si no entiendes algo que generó, pídele que te lo explique. Esto te hace crecer como desarrollador.

---

## 4. Comunicación con el cliente: entregando lo correcto

### 4.1 El principio de "valor visible temprano"

El cliente no puede evaluar código. Puede evaluar **lo que ve y toca**. Por eso:

> Prioriza siempre los entregables que el cliente puede ver, usar o mostrar a sus jefes.

**Para este proyecto, el orden de visibilidad correcto sería:**

```
Semana 1–2:  Diseño de pantallas (mockups navegables) → el cliente valida flujos
Semana 3–4:  Panel de administración básico funcional → el cliente sube su primera lectura
Semana 5–6:  App móvil que consume esa lectura → el cliente la ve en el teléfono
...y así, valor tangible en cada sprint.
```

---

### 4.2 Gestión de expectativas: el contrato de comunicación

Define esto con el cliente desde el día 1:

| Elemento | Definición |
|----------|------------|
| **Cadencia de demos** | Cada 2 semanas, el cliente ve lo construido |
| **Canal de feedback** | Un solo canal (WhatsApp, Slack, email — no todos a la vez) |
| **Tiempo de respuesta** | El cliente tiene X días para aprobar cada entregable |
| **Scope creep** | Cualquier requerimiento nuevo fuera del alcance original se cotiza por separado |
| **Ambiente de pruebas** | El cliente tiene acceso a un entorno de staging, no a producción |

---

### 4.3 El ciclo demo–feedback–ajuste

```
CONSTRUYES → DEMUESTRAS → CLIENTE REACCIONA → CLASIFICAS EL FEEDBACK
                                                        |
                               +------------------------+
                               v                        v
                        "Es un bug /            "Es una feature
                         malentendido"           nueva / mejora"
                               |                        |
                          Lo corriges             Lo cotizas y
                          en el sprint            agendas para
                          actual                  el siguiente
```

**Nunca agregues features nuevas al sprint actual sin acuerdo explícito** — aunque sean "pequeñas". El scope creep es la principal causa de proyectos que nunca terminan.

---

## 5. Fases del proyecto con IA integrada

### Fase 1: Discovery y Arquitectura *(Semana 1)*
- [ ] Reunión de levantamiento profundo
- [ ] Documento de requerimientos validado con el cliente
- [ ] Arquitectura definida y revisada (con ayuda de IA como revisor)
- [ ] Stack tecnológico elegido
- [ ] Repositorio creado, estructura base generada con IA
- [ ] Entorno de desarrollo local funcionando

### Fase 2: Backend y Panel de Admin *(Semanas 2–4)*
- [ ] Modelos de base de datos (IA genera el schema inicial, tú lo refinas)
- [ ] API de autenticación
- [ ] CRUD de lecturas, niveles y preguntas
- [ ] Panel de administración básico funcional
- [ ] **Demo #1 con el cliente** → valida el panel de admin

### Fase 3: App Móvil — MVP *(Semanas 5–8)*
- [ ] Pantallas de login y registro
- [ ] Mapa de ruta de aprendizaje
- [ ] Flujo lectura → cuestionario → progreso
- [ ] Perfil del estudiante con avances
- [ ] **Demo #2 con el cliente** → valida el flujo completo del estudiante

### Fase 4: Gamificación Básica *(Semanas 9–10)*
- [ ] Sistema de puntos
- [ ] Avatar básico personalizable
- [ ] **Demo #3 con el cliente** → valida la experiencia gamificada

### Fase 5: Estabilización y Lanzamiento *(Semanas 11–12)*
- [ ] Testing en dispositivos reales de gama baja
- [ ] Corrección de bugs
- [ ] Optimización de rendimiento
- [ ] Documentación del panel para el cliente
- [ ] Entrega y cierre de Fase 1

---

## 6. Herramientas de IA recomendadas por tipo de tarea

| Categoría | Herramienta | Para qué usarla |
|-----------|-------------|-----------------|
| **Código general** | GitHub Copilot / Cursor | Autocompletado inteligente en el IDE |
| **Generación de bloques** | Claude / ChatGPT | Generar módulos completos con contexto |
| **Prototipos UI rápidos** | v0.dev / Bolt.new | Prototipar pantallas en minutos |
| **Base de datos** | Supabase / Railway | Generar schemas y queries |
| **Testing** | Copilot / Claude | Generar casos de prueba |
| **Documentación** | Claude / Notion AI | Redactar docs técnicos y de usuario |
| **Generación de preguntas** | OpenAI API / Gemini API | La feature de IA del proyecto mismo |
| **Revisión de código** | Claude / ChatGPT | Code review antes de commit |
| **Debug** | Claude / Cursor | Análisis de errores con contexto |

---

## 7. Lo que la IA NO puede hacer por ti

Es importante ser honesto sobre los límites:

| Lo que la IA no puede hacer | Por qué importa en este proyecto |
|-----------------------------|----------------------------------|
| Entender el contexto cultural del cliente | Saber que en Guatemala muchos estudiantes tienen Android de gama baja |
| Tomar decisiones de negocio | Decidir si la Fase 2 va en septiembre u octubre |
| Garantizar la calidad del producto | El testing real, con usuarios reales, es tu responsabilidad |
| Gestionar la relación con el cliente | La confianza se construye persona a persona |
| Definir qué construir | El "qué" viene del levantamiento de requerimientos |
| Asumir responsabilidad | Si el código tiene un bug crítico, no hay IA que lo atienda a las 2am |

---

## 8. El entregable final: no es código, es valor

Cuando el proyecto termine, el cliente no recibirá un repositorio de GitHub. Recibirá:

- **Estudiantes que mejoran su comprensión lectora** (impacto real)
- **Un panel donde él controla su contenido** (autonomía)
- **Una herramienta que puede sostener y escalar** (independencia futura)

Cada decisión técnica que tomes durante el desarrollo debe pasar por este filtro:

> *¿Esto acerca o aleja al cliente de ese resultado?*

Si una decisión técnica es elegante pero complica la vida del cliente, no es la decisión correcta.

---

## 9. Resumen: el manifiesto del desarrollo con IA

```
1. Primero entiendo, luego construyo.
2. La IA acelera mi ejecución; mi criterio define qué ejecutar.
3. Entrego valor visible en cada sprint, no solo código.
4. El cliente valida el camino, yo controlo el vehículo.
5. Leo todo el código que la IA genera. Siempre.
6. Un requerimiento nuevo = una conversación de alcance.
7. El éxito no es "funciona en mi máquina". Es "funciona para el estudiante".
```

---

*Documento vivo — se actualiza con cada aprendizaje del proyecto.*

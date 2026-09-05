<div align="center">

# 💻 LectoApp — Panel de Administración
### Interfaz Web Editorial, Analítica en Tiempo Real y Gestión Autónoma

[![Vitest](https://img.shields.io/badge/Tests-172%20Passed-brightgreen?style=flat-square&logo=vitest)](https://vitest.dev/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?style=flat-square&logo=reactquery)](https://tanstack.com/query)
[![Zustand](https://img.shields.io/badge/Zustand-v5-4338CA?style=flat-square)](https://zustand-demo.pmnd.rs/)
[![Storybook](https://img.shields.io/badge/Storybook-v9-FF4785?style=flat-square&logo=storybook)](https://storybook.js.org/)

</div>

---

## 🎯 Propósito del Módulo

El **Panel de Administración** es la herramienta web que garantiza la **autonomía total del cliente** para gestionar el ciclo de vida de todo el contenido pedagógico de la plataforma sin requerir conocimientos técnicos ni intervención de ingenieros de software.

---

## 🏛 Arquitectura Frontend

Construido sobre una arquitectura moderna basada en componentes funcionales desacoplados y gestión diferenciada del estado:

* **Server State (TanStack Query v5):** Manejo optimista de datos, caché en memoria, reintentos automáticos e invalidación inteligente de consultas tras mutaciones.
* **Client / Auth State (Zustand):** Sesión de usuario reactiva con persistencia de credenciales y deslogueo automático ante expiración irrecuperable de sesión.
* **Formularios Robustos (React Hook Form + Zod):** Validación instantánea en cliente alineada contractualmente con los esquemas de validación del backend.
* **Componentes Accesibles (Radix UI):** Diálogos modales, menús desplegables y controles interactivos construidos sobre primitivas accesibles conformes a WAI-ARIA.
* **Analítica Visual (Recharts):** Renderizado declarativo y accesible de métricas sobre canvas SVG optimizado.

---

## ✨ Funcionalidades Principales

### 1. Dashboard Analítico
* Métricas agregadas en tiempo real: total de lecturas, preguntas activas, estudiantes registrados e intentos de cuestionarios completados.
* Gráficas interactivas:
  * Distribución de lecturas por estado (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
  * Estudiantes clasificados por escalafón de maestría (*Principiante* hasta *Supremo*).
  * Top de lecturas más leídas y completadas.

### 2. Gestión Editorial de Lecturas
* Creación y edición con cálculo automático de tiempo estimado de lectura y conteo de palabras.
* Subida de imágenes de portada con validación de tipo y previsualización inmediata.
* Filtros avanzados por nivel de comprensión (*Literal*, *Inferencial*, *Crítico*), estado de publicación y búsqueda por texto.
* Regla de negocio automatizada: El botón **"Publicar"** se bloquea con aviso explicativo hasta que la lectura posea al menos **5 preguntas en estado aprobado**.

### 3. Editor de Cuestionarios y Flujo de IA
* Banco de preguntas por lectura con soporte para **Opción Múltiple** (4 alternativas) y **Verdadero o Falso**.
* **Generación asistida por IA local:** Diálogo modal que solicita al backend (vía Ollama) preguntas sugeridas basadas en el texto.
* Barra de progreso de aprobación: Indicador visual del umbral mínimo de reactivos requeridos.
* Previsualización de lectura en modo estudiante para control de calidad previo a la publicación.

---

## 🎨 Design System y Accesibilidad (WCAG 2.2 AA)

El panel incorpora un sistema formal de tokens de diseño (`contracts/design-tokens.json` → `src/styles/tokens.ts`):

* **Cero colores arbitrarios:** Una suite de pruebas automatizada (`no-raw-colors.test.ts`) analiza todo el código para garantizar que ningún componente declare colores hexadecimales o RGB fuera del sistema de tokens.
* **Pruebas de Accesibilidad Automatizadas:** Integración de `@axe-core/react` y pruebas con Testing Library para validar contraste cromático, jerarquía de encabezados (`h1`-`h6`), atributos ARIA y navegación por teclado.

---

## 🧪 Pruebas Automatizadas

El panel cuenta con **172 pruebas automatizadas** que garantizan la integridad de componentes, páginas, ruteo y contratos:

```bash
# Ejecutar todas las pruebas unitarias y de componentes
pnpm test

# Ejecutar pruebas en modo observador
pnpm test:watch

# Ejecutar pruebas con reporte de cobertura
pnpm test:coverage
```

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo en Vite (http://localhost:5173)
pnpm dev

# Compilar bundle de producción optimizado
pnpm build

# Validar tipos TypeScript estrictos
pnpm typecheck

# Iniciar Storybook para catálogo de componentes visuales (puerto 6006)
pnpm storybook
```

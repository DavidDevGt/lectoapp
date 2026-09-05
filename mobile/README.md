<div align="center">

# 📱 LectoApp — Aplicación Móvil
### Experiencia Estudiantil Gamificada, Accesible y Optimizada

[![Tests](https://img.shields.io/badge/Tests-59%20Passed-brightgreen?style=flat-square)](https://jestjs.io/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-black?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-orange?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

</div>

---

## 🎯 Propósito del Módulo

La **App Móvil de LectoApp** es el punto de contacto directo con el estudiante de primaria y secundaria. Su propósito es motivar la lectura voluntaria y consistente mediante una experiencia interactiva, fluida y gamificada, optimizada para funcionar con alto rendimiento incluso en teléfonos inteligentes de gama baja.

---

## 🏛 Arquitectura de la Aplicación

```
[ RootNavigator ] (Deep Linking: lectoapp://)
    ├── No Autenticado
    │    ├── LoginScreen (Acceso con email/password + demo accounts)
    │    └── RegisterScreen (Creación de cuenta + selector de grado escolar)
    │
    └── Autenticado
         ├── TabNavigator
         │    ├── LearningMapScreen ("Ruta": listado categorizado de lecturas)
         │    └── ProfileScreen ("Perfil": progreso pedagógico, racha y puntos)
         │
         ├── ReaderScreen (Lectura inmersiva con estimación de tiempo)
         └── QuizScreen (Cuestionario interactivo, evaluación y celebración)
```

### Principios de Ingeniería Clave

1. **Resolución Dinámica de Red (`src/config/env.ts`):** Deduce automáticamente la IP del host Metro cuando se corre en Expo Go en un teléfono físico por Wi-Fi, conectando con el backend sin necesidad de reconfigurar archivos de configuración ni IP local manualmente.
2. **Almacenamiento Criptográfico Seguro (`tokenStore.ts`):** Persistencia de tokens de sesión (`accessToken` y `refreshToken`) mediante `expo-secure-store`, utilizando el enclave de hardware seguro nativo (**Android Keystore** / **iOS Keychain**).
3. **Capa HTTP Resiliente (`src/api/http.ts`):**
   - AbortController con timeout predeterminado por petición para evitar bloqueos por latencia de red.
   - Interceptor de autorización con **refresco transparente y deduplicado de sesión**: múltiples peticiones concurrentes en `401` comparten una única promesa de refresco de token, evitando tormentas de peticiones al servidor.
4. **Accesibilidad Universal (WCAG 2.2 AA):**
   - Áreas mínimas táctiles de **$48 \times 48$ dp** para evitar pulsaciones erróneas en niños.
   - Verificación de ratios de contraste cromático ($\ge 4.5:1$ en texto estándar, $\ge 3:1$ en titulares y componentes interactivos).
   - Etiquetas semánticas compuestas (`accessibilityRole`, `accessibilityLabel`, `accessibilityHint`) para lectores de pantalla TalkBack / VoiceOver.

---

## 🕹 Flujo Gamificado del Estudiante

1. **Ruta de Aprendizaje:** El estudiante explora lecturas clasificadas por dimensión cognitiva (*Literal*, *Inferencial*, *Crítica*).
2. **Lectura Inmersiva:** Tipografía optimizada con interlineado generoso para reducir fatiga visual y cálculo de tiempo de lectura.
3. **Desafío de Comprensión:** Al terminar el texto, se activa el cuestionario interactivo:
   - Retroalimentación formativa inmediata en cada respuesta.
   - Al alcanzar $\ge 70\%$, se despliega el modal de celebración con ganancia de puntos de experiencia, incremento de racha diaria (*streak*) y aviso si sube de escalafón de maestría.
4. **Perfil Pedagógico:** Visualización desglosada del porcentaje de comprensión alcanzado en cada uno de los tres niveles pedagógicos.

---

## 🧪 Pruebas Automatizadas

La aplicación cuenta con **59 pruebas automatizadas** que validan la capa de transporte HTTP, el almacenamiento en SecureStore, los componentes accesibles y las pantallas principales:

```bash
# Ejecutar la suite completa de pruebas
pnpm test

# Ejecutar pruebas en modo observador
pnpm test:watch

# Validación de tipos estrictos sin emitir compilado
pnpm typecheck
```

---

## 📱 Ejecución en Desarrollo

```bash
# Iniciar Metro Bundler (Muestra código QR para escanear en Expo Go)
pnpm start

# Previsualizar en navegador web (localhost:8081)
pnpm web

# Ejecutar directamente en emulador Android
pnpm android
```

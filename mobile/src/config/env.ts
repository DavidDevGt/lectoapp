import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL base del backend.
 *
 * PRODUCCIÓN: se toma exclusivamente de EXPO_PUBLIC_API_URL, inyectada en build
 * time por el perfil de EAS correspondiente. Debe ser HTTPS — iOS (ATS) y Android
 * (cleartext bloqueado desde API 28) rechazan http:// en builds de release.
 *
 * DESARROLLO: se deduce del servidor Metro para que un dispositivo físico con Expo
 * Go alcance la laptop por WiFi, con fallbacks para emulador Android y web/iOS.
 * Esta heurística depende de `hostUri`, que NO existe fuera del dev client — por eso
 * está confinada a __DEV__.
 */

const PRODUCTION_API_URL = process.env.EXPO_PUBLIC_API_URL;

function resolveDevBackendUrl(): string {
  // 1. IP de la máquina que corre Metro (dispositivo físico en la misma WiFi)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000/api`;
    }
  }

  // 2. Emulador de Android Studio
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  // 3. Navegador web / simulador de iOS
  return 'http://localhost:3000/api';
}

let cachedUrl: string | null = null;

/**
 * Se resuelve de forma perezosa, no al cargar el módulo: si la configuración es
 * inválida queremos que falle dentro de una petición —donde la UI puede mostrarlo—
 * y no durante el arranque, que dejaría la pantalla en blanco sin ErrorBoundary.
 */
export function getApiBaseUrl(): string {
  if (cachedUrl) return cachedUrl;

  if (!__DEV__) {
    if (!PRODUCTION_API_URL) {
      throw new Error(
        'EXPO_PUBLIC_API_URL no está configurada. Defínela en el perfil de EAS antes de compilar una build de release.',
      );
    }
    if (!PRODUCTION_API_URL.startsWith('https://')) {
      throw new Error('EXPO_PUBLIC_API_URL debe usar HTTPS en builds de producción.');
    }
    cachedUrl = PRODUCTION_API_URL;
    return PRODUCTION_API_URL;
  }

  // En desarrollo, una URL explícita siempre gana sobre la heurística.
  const resolved = PRODUCTION_API_URL ?? resolveDevBackendUrl();
  cachedUrl = resolved;
  return resolved;
}

/** Tiempo máximo por petición. Sin esto, una red a medio abrir deja la UI girando para siempre. */
export const REQUEST_TIMEOUT_MS = 10_000;

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Resuelve automáticamente la URL del Backend REST API dependiendo del entorno:
 * 1. Dispositivo físico con Expo Go (WiFi): Extrae la IP de la laptop/PC (ej. http://192.168.1.5:3000/api).
 * 2. Emulador de Android Studio: Usa http://10.0.2.2:3000/api.
 * 3. Navegador Web / Simulador iOS: Usa http://localhost:3000/api.
 */
function resolveBackendUrl(): string {
  // 1. Extraer IP desde el servidor Metro de Expo
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000/api`;
    }
  }

  // 2. Fallback para emulador Android
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }

  // 3. Fallback para Web / iOS
  return 'http://localhost:3000/api';
}

export const API_BASE_URL = resolveBackendUrl();

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User } from '../types/api';

/**
 * Persistencia de la sesión.
 *
 * En nativo usa el Keychain (iOS) / Keystore (Android) vía expo-secure-store.
 * En web SecureStore no existe; se degrada a localStorage, que NO es almacenamiento
 * seguro — la build web es solo para desarrollo y demos internas.
 */

const ACCESS_TOKEN_KEY = 'lectoapp.accessToken';
const REFRESH_TOKEN_KEY = 'lectoapp.refreshToken';
const USER_KEY = 'lectoapp.user';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
}

const isWeb = Platform.OS === 'web';

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStore = {
  async save(session: StoredSession): Promise<void> {
    await Promise.all([
      setItem(ACCESS_TOKEN_KEY, session.accessToken),
      setItem(REFRESH_TOKEN_KEY, session.refreshToken),
    ]);
  },

  async load(): Promise<StoredSession | null> {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  },

  /**
   * El backend no expone GET /auth/me, así que cacheamos el perfil para poder
   * rehidratar la sesión. Los totales (puntos, racha, nivel) se revalidan siempre
   * contra GET /progress/me al arrancar — el cache solo aporta id, nombre y correo.
   */
  async saveUser(user: User): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },

  async loadUser(): Promise<User | null> {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await Promise.all([
      removeItem(ACCESS_TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
    ]);
  },
};

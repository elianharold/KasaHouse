import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolve the API base URL. Priority:
 *  1. EXPO_PUBLIC_API_BASE_URL (set in .env / EAS)
 *  2. app.json > expo.extra.apiBaseUrl
 *  3. a sensible localhost default per platform
 *
 * Android emulators cannot reach the host's "localhost" — they use 10.0.2.2.
 * A physical device needs the dev machine's LAN IP, which Expo exposes via
 * Constants.expoConfig.hostUri; we reuse that host with the API port.
 */
const DEFAULT_PORT = 4000;
const API_PATH = '/api/v1';

function inferFromExpoHost(): string | null {
  const legacyHost = (
    Constants as unknown as {
      manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
    }
  ).manifest2?.extra?.expoClient?.hostUri;
  const hostUri = Constants.expoConfig?.hostUri ?? legacyHost ?? null;
  if (!hostUri) return null;
  const host = String(hostUri).split(':')[0];
  if (!host) return null;
  return `http://${host}:${DEFAULT_PORT}${API_PATH}`;
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv;

  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;

  const inferred = inferFromExpoHost();
  if (inferred) return inferred;

  if (fromExtra) {
    if (Platform.OS === 'android' && fromExtra.includes('localhost')) {
      return fromExtra.replace('localhost', '10.0.2.2');
    }
    return fromExtra;
  }

  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:${DEFAULT_PORT}${API_PATH}`;
}

export const env = {
  apiBaseUrl: resolveBaseUrl(),
  isDev: __DEV__,
} as const;

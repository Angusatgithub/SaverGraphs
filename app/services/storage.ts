import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  API_KEY: 'up_api_key',
} as const;

export async function storeApiKey(apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.API_KEY, apiKey);
}

export async function getStoredApiKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(STORAGE_KEYS.API_KEY);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.API_KEY);
} 
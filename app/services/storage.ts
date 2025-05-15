import * as SecureStore from 'expo-secure-store';
import { Timeframe } from '../../components/TimeframeSelectionModal'; // Import Timeframe type

const STORAGE_KEYS = {
  API_KEY: 'up_api_key',
  SELECTED_ACCOUNT_IDS: 'selected_account_ids',
  TIMEFRAME: 'selected_timeframe', // New key for timeframe
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

export async function storeSelectedAccountIds(accountIds: string[]): Promise<void> {
  try {
    const jsonValue = JSON.stringify(accountIds);
    await SecureStore.setItemAsync(STORAGE_KEYS.SELECTED_ACCOUNT_IDS, jsonValue);
  } catch (e) {
    console.error('Failed to save selected account IDs', e);
    // Optionally, re-throw or handle error appropriately
  }
}

export async function getStoredSelectedAccountIds(): Promise<string[] | null> {
  try {
    const jsonValue = await SecureStore.getItemAsync(STORAGE_KEYS.SELECTED_ACCOUNT_IDS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to load selected account IDs', e);
    // Optionally, return null or handle error appropriately
    return null;
  }
}

export async function clearSelectedAccountIds(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.SELECTED_ACCOUNT_IDS);
  } catch (e) {
    console.error('Failed to clear selected account IDs', e);
    // Optionally, re-throw or handle error appropriately
  }
}

// New functions for timeframe
export async function storeTimeframe(timeframe: Timeframe): Promise<void> {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.TIMEFRAME, timeframe);
  } catch (e) {
    console.error('Failed to save timeframe', e);
  }
}

export async function getStoredTimeframe(): Promise<Timeframe | null> {
  try {
    const timeframeValue = await SecureStore.getItemAsync(STORAGE_KEYS.TIMEFRAME);
    // Basic validation, can be expanded if Timeframe type becomes more complex
    if (timeframeValue === 'Weekly' || timeframeValue === 'Monthly' || timeframeValue === 'Yearly' || timeframeValue === 'All') {
      return timeframeValue as Timeframe;
    }
    return null; // Return null if stored value isn't a valid Timeframe
  } catch (e) {
    console.error('Failed to load timeframe', e);
    return null;
  }
}

export async function clearStoredTimeframe(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TIMEFRAME);
  } catch (e) {
    console.error('Failed to clear timeframe', e);
  }
} 
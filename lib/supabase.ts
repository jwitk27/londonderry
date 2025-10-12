import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;
const url = extra?.EXPO_PUBLIC_SUPABASE_URL as string;
const anon = extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
if (!url || !anon) throw new Error('Missing Supabase env');

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const WebStorageAdapter = {
  getItem: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => { globalThis.localStorage?.setItem(key, value); },
  removeItem: async (key: string) => { globalThis.localStorage?.removeItem(key); },
};

export const supabase = createClient(url, anon, {
  auth: {
    storage: Platform.OS === 'web' ? WebStorageAdapter : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,           // ✅ persists across reloads
    detectSessionInUrl: false,
  },
});

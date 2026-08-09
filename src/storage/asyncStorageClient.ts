import AsyncStorage from '@react-native-async-storage/async-storage';

interface StorageEnvelope<T> {
  version: number;
  data: T;
}

const ENVELOPE_VERSION = 1;

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const envelope: StorageEnvelope<T> = JSON.parse(raw);
    return envelope.data ?? null;
  } catch (error) {
    console.error(`[Storage] Failed to read key: ${key}`, error);
    throw new StorageError(`Failed to read ${key}`, error);
  }
}

export async function storageSet<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: StorageEnvelope<T> = { version: ENVELOPE_VERSION, data };
    await AsyncStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    console.error(`[Storage] Failed to write key: ${key}`, error);
    throw new StorageError(`Failed to write ${key}`, error);
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove key: ${key}`, error);
    throw new StorageError(`Failed to remove ${key}`, error);
  }
}

export class StorageError extends Error {
  cause: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

import { Settings } from '../../shared/types/settings.types';
import { STORAGE_KEYS } from '../../shared/constants/appConstants';
import { storageGet, storageSet } from '../asyncStorageClient';

const DEFAULT_SETTINGS: Settings = {
  currencyCode: 'INR',
  currencySymbol: '₹',
  themeMode: 'system',
  language: 'en',
  appLockEnabled: false,
  appLockMethod: null,
  appLockTimeoutMinutes: 1,
  budgetNotificationsEnabled: true,
  dailyReminderEnabled: false,
  dailyReminderTime: null,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  allowFutureDatedEntries: false,
  onboardingCompleted: false,
  schemaVersion: 1,
  defaultTransactionType: 'expense',
  lastUsedPaymentMethod: 'cash',
  historyDefaultSort: 'date_desc',
};

async function get(): Promise<Settings> {
  const stored = await storageGet<Partial<Settings>>(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

async function update(changes: Partial<Settings>): Promise<Settings> {
  const current = await get();
  const updated = { ...current, ...changes };
  await storageSet(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

async function initDefaults(): Promise<Settings> {
  const existing = await storageGet<Settings>(STORAGE_KEYS.SETTINGS);
  if (existing) return existing;
  await storageSet(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export const SettingsRepository = { get, update, initDefaults };

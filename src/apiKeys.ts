import { Provider } from './streak';

const LEGACY_KEY = 'study_everyday_key';

function storageKey(provider: Provider): string {
  return `study_everyday_key_${provider}`;
}

export function getApiKey(provider: Provider): string {
  const saved = sessionStorage.getItem(storageKey(provider));
  if (saved !== null) return saved;

  // keys entered before there was more than one provider
  if (provider === 'gemini') {
    return sessionStorage.getItem(LEGACY_KEY) || '';
  }
  return '';
}

export function setApiKey(provider: Provider, key: string): void {
  sessionStorage.setItem(storageKey(provider), key);
}

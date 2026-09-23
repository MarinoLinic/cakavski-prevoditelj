export const DEFAULT_URL_STATE = Object.freeze({
  from: 'standard',
  to: 'cakavian',
  fromAlphabet: 'latin',
  toAlphabet: 'latin',
  theme: 'dark',
});

export const URL_STATE_OPTIONS = Object.freeze({
  from: Object.freeze(['standard', 'cakavian', 'dalmatian']),
  to: Object.freeze(['standard', 'cakavian', 'dalmatian']),
  fromAlphabet: Object.freeze(['latin', 'glagolitic', 'cyrillic']),
  toAlphabet: Object.freeze(['latin', 'glagolitic', 'cyrillic']),
  theme: Object.freeze(['dark', 'light']),
});

const PARAMETER_ORDER = ['from', 'to', 'fromAlphabet', 'toAlphabet', 'theme'];

function normalizeSearch(search) {
  const value = String(search ?? '');
  return value.startsWith('?') ? value.slice(1) : value;
}

export function parseUrlState(search) {
  const params = new URLSearchParams(normalizeSearch(search));
  return Object.fromEntries(PARAMETER_ORDER.map((key) => {
    const value = params.get(key);
    return [key, URL_STATE_OPTIONS[key].includes(value) ? value : DEFAULT_URL_STATE[key]];
  }));
}

export function serializeUrlState(state) {
  const params = new URLSearchParams();
  for (const key of PARAMETER_ORDER) {
    const value = URL_STATE_OPTIONS[key].includes(state?.[key]) ? state[key] : DEFAULT_URL_STATE[key];
    params.set(key, value);
  }
  return `?${params.toString()}`;
}

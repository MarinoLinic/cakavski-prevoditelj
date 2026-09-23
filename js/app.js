import { createTranslator } from './translator.js';
import { transliterate, toLatin, getAlphabetEntries } from './alphabets.js';
import { parseUrlState, serializeUrlState } from './url-state.js';

const $ = (id) => document.getElementById(id);
const LANGUAGE_LABELS = {
  standard: 'Standardni hrvatski',
  cakavian: 'Čakavski (Kvarner)',
  dalmatian: 'Dalmatinska ikavica (beta)',
};
const ALPHABET_LABELS = {
  latin: 'Latinica',
  glagolitic: 'Glagoljica',
  cyrillic: 'Ćirilica',
};

const els = {
  sourceLang: $('source-lang'),
  sourceAlpha: $('source-alpha'),
  sourceText: $('source-text'),
  targetLang: $('target-lang'),
  targetAlpha: $('target-alpha'),
  targetText: $('target-text'),
  charCount: $('char-count'),
  clearBtn: $('clear-btn'),
  copyBtn: $('copy-btn'),
  swapBtn: $('swap-btn'),
  statusPrefix: $('status-prefix'),
  changedCount: $('changed-count'),
  statusSuffix: $('status-suffix'),
  highlightToggle: $('highlight-toggle'),
  sampleSelect: $('sample-select'),
  themeToggle: $('theme-toggle'),
  dialog: $('info-dialog'),
  dialogTitle: $('dialog-title'),
  dialogClose: $('dialog-close'),
  dialogSearch: $('dialog-search'),
  dialogSearchLabel: $('dialog-search-label'),
  dialogList: $('dialog-list'),
  dialogEmpty: $('dialog-empty'),
};

let translator = null;
let samples = [];
let highlightEnabled = false;
let dialogOpener = null;
let copyTimer = null;
let dialogTimer = null;
let modalRows = [];
let modalKind = 'language';

function updateInfoButtons() {
  document.querySelectorAll('.info-button').forEach((button) => {
    const control = $(button.dataset.control);
    const kind = button.dataset.infoKind;
    const label = kind === 'language'
      ? LANGUAGE_LABELS[control.value]
      : ALPHABET_LABELS[control.value];
    button.setAttribute('aria-label', kind === 'language' ? `Otvori rječnik: ${label}` : `Otvori pregled pisma: ${label}`);
  });
}

function updateChangedStatus(count) {
  const singular = count === 1;
  els.statusPrefix.textContent = singular ? 'Promijenjena' : 'Promijenjeno';
  els.changedCount.textContent = String(count);
  els.statusSuffix.textContent = singular ? 'riječ' : 'riječi';
  els.highlightToggle.hidden = count === 0;
  els.highlightToggle.textContent = highlightEnabled ? 'Sakrij' : 'Prikaži';
  els.highlightToggle.setAttribute('aria-pressed', String(highlightEnabled));
}

function renderResult(segments) {
  els.targetText.replaceChildren();
  for (const segment of segments) {
    const rendered = transliterate(segment.text, 'latin', els.targetAlpha.value);
    if (highlightEnabled && segment.changed) {
      const mark = document.createElement('mark');
      mark.className = 'changed-word';
      mark.textContent = rendered;
      els.targetText.append(mark);
    } else {
      els.targetText.append(document.createTextNode(rendered));
    }
  }
}

function runTranslation() {
  if (!translator) return;
  const input = toLatin(els.sourceText.value, els.sourceAlpha.value);
  const result = translator.inspect(input, els.sourceLang.value, els.targetLang.value);
  renderResult(result.segments);
  els.charCount.textContent = `${[...els.sourceText.value].length} znakova`;
  updateChangedStatus(result.changed);
  updateInfoButtons();
}

function swap() {
  const sourceLang = els.sourceLang.value;
  const sourceAlpha = els.sourceAlpha.value;
  els.sourceLang.value = els.targetLang.value;
  els.sourceAlpha.value = els.targetAlpha.value;
  els.targetLang.value = sourceLang;
  els.targetAlpha.value = sourceAlpha;
  els.sourceText.value = els.targetText.textContent;
  updateInfoButtons();
  updateHistory('pushState');
  runTranslation();
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  els.themeToggle.setAttribute('aria-pressed', String(!dark));
  els.themeToggle.setAttribute('aria-label', dark ? 'Uključi svijetlu temu' : 'Uključi tamnu temu');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#08111a' : '#eef4f6');
}

function currentUrlState() {
  return {
    from: els.sourceLang.value,
    to: els.targetLang.value,
    fromAlphabet: els.sourceAlpha.value,
    toAlphabet: els.targetAlpha.value,
    theme: document.documentElement.dataset.theme,
  };
}

function updateHistory(method, state = currentUrlState()) {
  const url = new URL(window.location.href);
  url.search = serializeUrlState(state);
  window.history[method](window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function persistTheme(theme) {
  try {
    localStorage.setItem('prevoditelj-narjecja-theme', theme);
  } catch {
  }
}

function applyUrlState(state) {
  els.sourceLang.value = state.from;
  els.targetLang.value = state.to;
  els.sourceAlpha.value = state.fromAlphabet;
  els.targetAlpha.value = state.toAlphabet;
  applyTheme(state.theme);
  persistTheme(state.theme);
  updateInfoButtons();
}

function resolveTheme(search) {
  const urlTheme = new URLSearchParams(search).get('theme');
  if (urlTheme === 'dark' || urlTheme === 'light') return urlTheme;
  try {
    const stored = localStorage.getItem('prevoditelj-narjecja-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
  }
  try {
    if (typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
  } catch {
  }
  return 'dark';
}

function initializeHighlightPreference() {
  try {
    highlightEnabled = localStorage.getItem('prevoditelj-narjecja-highlight') === 'true';
  } catch {
    highlightEnabled = false;
  }
}

function persistHighlightPreference() {
  try {
    localStorage.setItem('prevoditelj-narjecja-highlight', String(highlightEnabled));
  } catch {
  }
}

function stateFromLocation() {
  const state = parseUrlState(window.location.search);
  state.theme = resolveTheme(window.location.search);
  return state;
}

function initializeUrlState() {
  const state = stateFromLocation();
  applyUrlState(state);
  updateHistory('replaceState', state);
}

function restoreUrlState() {
  const state = stateFromLocation();
  applyUrlState(state);
  updateHistory('replaceState', state);
  runTranslation();
}

function populateSamples() {
  for (const [index, sample] of samples.entries()) {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = sample.title;
    els.sampleSelect.append(option);
  }
}

function appendLanguageRows(rows) {
  els.dialogList.replaceChildren();
  for (const row of rows) {
    const element = document.createElement('div');
    element.className = modalKind === 'alphabet' ? 'alphabet-row' : 'lexicon-row';
    if (modalKind === 'language' && row.profile) {
      const source = document.createElement('span');
      source.className = 'lexicon-source';
      source.textContent = row.source;
      const target = document.createElement('span');
      target.textContent = row.target;
      const badge = document.createElement('span');
      badge.className = 'profile-badge';
      badge.textContent = row.profile;
      element.append(source, target, badge);
    } else if (modalKind === 'alphabet') {
      const source = document.createElement('span');
      source.textContent = row.source;
      const target = document.createElement('span');
      target.className = 'alphabet-target';
      target.textContent = row.target;
      element.append(source, target);
    } else {
      const dialect = document.createElement('span');
      dialect.textContent = row.target;
      const standard = document.createElement('span');
      standard.className = 'lexicon-source';
      standard.textContent = row.source;
      element.append(dialect, standard);
    }
    els.dialogList.append(element);
  }
  els.dialogEmpty.hidden = rows.length > 0;
}

function renderModalRows(query = '') {
  const needle = query.normalize('NFC').toLocaleLowerCase('hr').trim();
  const filtered = modalRows.filter((row) => `${row.source} ${row.target} ${row.profile ?? ''}`
    .normalize('NFC').toLocaleLowerCase('hr').includes(needle));
  appendLanguageRows(filtered);
}

function openInfo(button) {
  if (!translator || els.dialog.open) return;
  dialogOpener = button;
  modalKind = button.dataset.infoKind;
  els.dialogList.classList.toggle('alphabet-list', modalKind === 'alphabet');
  els.dialogSearch.hidden = modalKind !== 'language';
  els.dialogSearchLabel.hidden = modalKind !== 'language';
  if (modalKind === 'language') {
    const language = $(button.dataset.control).value;
    els.dialogTitle.textContent = LANGUAGE_LABELS[language];
    modalRows = translator.getLexicon(language);
  } else {
    const alphabet = $(button.dataset.control).value;
    els.dialogTitle.textContent = ALPHABET_LABELS[alphabet];
    modalRows = getAlphabetEntries(alphabet);
  }
  els.dialogSearch.value = '';
  renderModalRows();
  els.dialog.showModal();
  if (modalKind === 'language') els.dialogSearch.focus();
  else els.dialogList.focus();
}

function closeDialog() {
  if (!els.dialog.open || els.dialog.classList.contains('is-closing')) return;
  els.dialog.classList.add('is-closing');
  clearTimeout(dialogTimer);
  dialogTimer = setTimeout(() => {
    els.dialog.close();
    els.dialog.classList.remove('is-closing');
    dialogOpener?.focus();
    dialogOpener = null;
  }, 130);
}

function confirmCopy() {
  clearTimeout(copyTimer);
  els.copyBtn.textContent = 'Kopirano.';
  copyTimer = setTimeout(() => {
    els.copyBtn.textContent = 'Kopiraj';
  }, 1200);
}

async function copyResult() {
  const text = els.targetText.textContent;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const temporary = document.createElement('textarea');
    temporary.value = text;
    temporary.setAttribute('readonly', '');
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.append(temporary);
    temporary.select();
    document.execCommand('copy');
    temporary.remove();
  }
  confirmCopy();
}

els.sourceText.addEventListener('input', () => runTranslation());
for (const select of [els.sourceLang, els.sourceAlpha, els.targetLang, els.targetAlpha]) {
  select.addEventListener('change', () => {
    updateHistory('pushState');
    runTranslation();
  });
}
els.swapBtn.addEventListener('click', swap);
els.clearBtn.addEventListener('click', () => {
  els.sourceText.value = '';
  runTranslation();
  els.sourceText.focus();
});
els.copyBtn.addEventListener('click', copyResult);
els.highlightToggle.addEventListener('click', () => {
  highlightEnabled = !highlightEnabled;
  persistHighlightPreference();
  runTranslation();
});
els.sampleSelect.addEventListener('change', () => {
  const sample = samples[Number(els.sampleSelect.value)];
  if (!sample) return;
  const sourceLanguageChanged = els.sourceLang.value !== 'standard';
  els.sourceLang.value = 'standard';
  els.sourceText.value = transliterate(sample.text, 'latin', els.sourceAlpha.value);
  if (sourceLanguageChanged) updateHistory('pushState');
  runTranslation();
  els.sampleSelect.value = '';
});
els.themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  updateHistory('pushState', { ...currentUrlState(), theme: next });
  applyTheme(next);
  persistTheme(next);
  runTranslation();
});
document.querySelectorAll('.info-button').forEach((button) => button.addEventListener('click', () => openInfo(button)));
els.dialogClose.addEventListener('click', closeDialog);
els.dialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeDialog();
});
els.dialog.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeDialog();
  }
});
els.dialog.addEventListener('click', (event) => {
  if (event.target === els.dialog) closeDialog();
});
els.dialogSearch.addEventListener('input', () => renderModalRows(els.dialogSearch.value));
els.dialog.addEventListener('close', () => {
  clearTimeout(dialogTimer);
  els.dialog.classList.remove('is-closing');
  dialogOpener?.focus();
  dialogOpener = null;
});

$('current-year').textContent = String(new Date().getFullYear());
initializeHighlightPreference();
initializeUrlState();
window.addEventListener('popstate', restoreUrlState);
Promise.all([
  fetch('data/cakavian.json').then((response) => {
    if (!response.ok) throw new Error('Čakavski podaci nisu dostupni.');
    return response.json();
  }),
  fetch('data/dalmatian.json').then((response) => {
    if (!response.ok) throw new Error('Dalmatinski podaci nisu dostupni.');
    return response.json();
  }),
  fetch('data/samples.json').then((response) => {
    if (!response.ok) throw new Error('Primjeri nisu dostupni.');
    return response.json();
  }),
]).then(([cakavian, dalmatian, loadedSamples]) => {
  translator = createTranslator({ cakavian, dalmatian });
  samples = loadedSamples;
  populateSamples();
  runTranslation();
}).catch(() => {
  els.statusPrefix.textContent = 'Podaci se nisu mogli učitati.';
  els.changedCount.hidden = true;
  els.statusSuffix.hidden = true;
});

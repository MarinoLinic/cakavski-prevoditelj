import { createTranslator } from './translator.js';
import { transliterate, toLatin, getAlphabetEntries, getAlphabetDirection } from './alphabets.js';
import { parseUrlState, serializeUrlState } from './url-state.js';

const $ = (id) => document.getElementById(id);
const LANGUAGE_LABELS = {
  standard: 'Standardni hrvatski',
  chakavian: 'Čakavski (Kvarner)',
  dalmatian: 'Dalmatinska ikavica (beta)',
};
const ALPHABET_LABELS = {
  latin: 'Latinica',
  glagolitic: 'Glagoljica',
  cyrillic: 'Ćirilica',
  arebica: 'Arebica',
  hebrew: 'Hebrejsko pismo',
  georgian: 'Gruzijsko pismo',
  hieroglyphs: 'Hijeroglifi',
  'linear-b': 'Linear B',
};
const ALPHABET_NOTES = {
  arebica: 'Bosanska arebica prilagođena hrvatskoj latinici.',
  hebrew: 'Projektno preslikavanje znakova, ne povijesni pravopis.',
  georgian: 'Projektno preslikavanje znakova, ne povijesni pravopis.',
  hieroglyphs: 'Projektno preslikavanje znakova, ne povijesni pravopis.',
  'linear-b': 'Projektno preslikavanje znakova, ne povijesni pravopis.',
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
  sampleMenu: $('sample-menu'),
  sampleTrigger: $('sample-trigger'),
  sampleOptions: $('sample-options'),
  themeToggle: $('theme-toggle'),
  dialog: $('info-dialog'),
  dialogTitle: $('dialog-title'),
  dialogNote: $('dialog-note'),
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
let sampleMenuTimer = null;
let modalRows = [];
let modalKind = 'language';
let modalAlphabet = 'latin';

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

function updateTextDirections() {
  for (const [field, alphabet] of [[els.sourceText, els.sourceAlpha.value], [els.targetText, els.targetAlpha.value]]) {
    const direction = getAlphabetDirection(alphabet);
    field.dir = direction;
    field.style.direction = direction;
    field.style.textAlign = direction === 'rtl' ? 'right' : 'left';
  }
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
  updateTextDirections();
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
  updateTextDirections();
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
  els.sampleOptions.replaceChildren();
  for (const [index, sample] of samples.entries()) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'sample-option';
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');
    option.dataset.sampleIndex = String(index);
    option.textContent = sample.title;
    option.addEventListener('click', () => insertSample(index));
    els.sampleOptions.append(option);
  }
}

function openSampleMenu() {
  clearTimeout(sampleMenuTimer);
  els.sampleOptions.hidden = false;
  els.sampleOptions.classList.remove('is-closing');
  requestAnimationFrame(() => els.sampleMenu.classList.add('is-open'));
  els.sampleTrigger.setAttribute('aria-expanded', 'true');
}

function closeSampleMenu(restoreFocus = false) {
  if (els.sampleOptions.hidden || els.sampleOptions.classList.contains('is-closing')) return;
  els.sampleMenu.classList.remove('is-open');
  els.sampleOptions.classList.add('is-closing');
  els.sampleTrigger.setAttribute('aria-expanded', 'false');
  clearTimeout(sampleMenuTimer);
  sampleMenuTimer = setTimeout(() => {
    els.sampleOptions.hidden = true;
    els.sampleOptions.classList.remove('is-closing');
    if (restoreFocus) els.sampleTrigger.focus();
  }, 150);
}

function toggleSampleMenu() {
  if (els.sampleOptions.hidden || els.sampleOptions.classList.contains('is-closing')) openSampleMenu();
  else closeSampleMenu();
}

function insertSample(index) {
  const sample = samples[index];
  if (!sample) return;
  const sourceLanguageChanged = els.sourceLang.value !== 'standard';
  els.sourceLang.value = 'standard';
  els.sourceText.value = transliterate(sample.text, 'latin', els.sourceAlpha.value);
  if (sourceLanguageChanged) updateHistory('pushState');
  runTranslation();
  closeSampleMenu(true);
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
      target.dir = getAlphabetDirection(modalAlphabet);
      target.style.direction = target.dir;
      target.style.textAlign = target.dir === 'rtl' ? 'right' : 'left';
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
  els.dialogNote.hidden = true;
  els.dialogList.dir = 'ltr';
  if (modalKind === 'language') {
    const language = $(button.dataset.control).value;
    els.dialogTitle.textContent = LANGUAGE_LABELS[language];
    modalRows = translator.getLexicon(language);
  } else {
    modalAlphabet = $(button.dataset.control).value;
    els.dialogTitle.textContent = ALPHABET_LABELS[modalAlphabet];
    modalRows = getAlphabetEntries(modalAlphabet);
    const direction = getAlphabetDirection(modalAlphabet);
    els.dialogList.dir = direction;
    els.dialogList.style.textAlign = direction === 'rtl' ? 'right' : 'left';
    els.dialogNote.textContent = ALPHABET_NOTES[modalAlphabet] ?? '';
    els.dialogNote.hidden = !els.dialogNote.textContent;
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
els.sampleTrigger.addEventListener('click', toggleSampleMenu);
document.addEventListener('click', (event) => {
  if (!els.sampleMenu.contains(event.target)) closeSampleMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.sampleOptions.hidden) {
    event.preventDefault();
    closeSampleMenu(true);
  }
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

initializeHighlightPreference();
initializeUrlState();
window.addEventListener('popstate', restoreUrlState);
Promise.all([
  fetch('data/chakavian.json').then((response) => {
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
]).then(([chakavian, dalmatian, loadedSamples]) => {
  translator = createTranslator({ chakavian, dalmatian });
  samples = loadedSamples;
  populateSamples();
  runTranslation();
}).catch(() => {
  els.statusPrefix.textContent = 'Podaci se nisu mogli učitati.';
  els.changedCount.hidden = true;
  els.statusSuffix.hidden = true;
});

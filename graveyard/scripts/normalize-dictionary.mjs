import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_PATH = path.join(ROOT, 'data', 'source-cakavian.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'cakavian.json');

const SENTENCE_PUNCT = /[.!?:;]/;
const DESCRIPTION_MARKERS = [
  'vrsta ', 'onaj ', 'ono ', 'mjesto ', 'područje ', 'najčešće ',
  'primjer ', 'služi ', 'stoti dio ', 'ostatak ', 'zvuk ', 'boca od ', 'učestal ',
];

const CURATED = [
  ['staviti', 'stavit'],
  ['popiti', 'popit'],
  ['prošetati', 'špašižat'],
  ['kuća', 'kuća'],
  ['piće', 'piće'],
  ['šank', 'šank'],
  ['dvije', 'dve'],
];

const METADATA = {
  name: 'Čakavski rječnik Kvarnera i riječkoga područja',
  scope: 'Kvarner, Rijeka i okolni lokalni govori',
  sourceName: 'Lokalpatrioti Rijeka, Čakavski rječnik',
  sourceUrl: 'https://lokalpatrioti-rijeka.com/cakavski-rjecnik/',
  retrieved: '22. rujna 2026.',
  licenseNote: 'Izvor nije naveo strojno čitljivu licencu. Podaci se čuvaju uz navođenje izvora.',
  generatedBy: 'npm run normalize',
};

function clean(value) {
  return (value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

function wordCount(piece) {
  return piece.split(' ').filter(Boolean).length;
}

function startsWithMarker(piece) {
  const lower = piece.toLowerCase();
  return DESCRIPTION_MARKERS.some((marker) => lower.startsWith(marker));
}

function extractParentheticals(text) {
  const inner = [];
  let rest = '';
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') {
      if (depth > 0) current += ch;
      depth += 1;
    } else if (ch === ')' && depth > 0) {
      depth -= 1;
      if (depth > 0) current += ch;
      else {
        inner.push(current.trim());
        current = '';
      }
    } else if (depth > 0) {
      current += ch;
    } else {
      rest += ch;
    }
  }
  if (depth > 0) rest += ' ' + current;
  rest = rest.replace(/\s+/g, ' ').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
  return { rest, inner };
}

function stripTerminal(term) {
  return term.replace(/[.\s]+$/, '');
}

function parseCakavian(raw) {
  const notes = [];
  const { rest, inner } = extractParentheticals(raw);
  let reflexive = false;
  const extra = [];
  for (const part of inner) {
    if (part.toLowerCase() === 'se') {
      reflexive = true;
    } else {
      notes.push(part);
      if (wordCount(part) <= 3 && !SENTENCE_PUNCT.test(part)) extra.push(part);
    }
  }
  const pieces = rest.split(',').map((p) => p.trim()).filter(Boolean);
  const list = pieces.length ? pieces : [rest];
  let forms;
  const valid = list.every((p) => wordCount(p) >= 1 && wordCount(p) <= 3 && !SENTENCE_PUNCT.test(p));
  if (valid) {
    forms = list;
  } else {
    forms = [rest];
    notes.push(raw);
  }
  forms = forms.map((f) => stripTerminal(f)).filter(Boolean);
  if (reflexive && forms.length) forms[forms.length - 1] = forms[forms.length - 1] + ' se';
  forms = [...forms, ...extra];
  return { forms, notes };
}

function parseStandard(raw) {
  const notes = [];
  const { rest, inner } = extractParentheticals(raw);
  for (const part of inner) if (part) notes.push(part);
  const pieces = rest.split(',').map((p) => p.trim()).filter(Boolean);
  const list = pieces.length ? pieces : [rest];
  let forms;
  const valid = list.every(
    (p) => wordCount(p) >= 1 && wordCount(p) <= 4 && !SENTENCE_PUNCT.test(p) && !startsWithMarker(p),
  );
  if (valid) {
    forms = list;
  } else {
    forms = [list[0]];
    notes.push(raw);
  }
  forms = forms.map((f) => stripTerminal(f)).filter(Boolean);
  return { forms, notes };
}

function compareEntries(a, b) {
  return compareStrings(a.cakavian[0], b.cakavian[0]);
}

const collator = (() => {
  try {
    const c = new Intl.Collator('hr');
    if (Intl.Collator.supportedLocalesOf(['hr']).includes('hr')) return c;
  } catch {
    return null;
  }
  return null;
})();

function compareStrings(a, b) {
  if (collator) {
    const r = collator.compare(a, b);
    if (r !== 0) return r;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export function normalize(rawRows) {
  const seen = new Set();
  const entries = [];
  let droppedMissing = 0;
  let droppedDuplicates = 0;
  let droppedEmpty = 0;

  for (const row of rawRows) {
    const cak = clean(row.cakavski);
    const std = clean(row.stokavski);
    if (!cak || !std) {
      droppedMissing += 1;
      continue;
    }
    const key = (cak + ' ' + std).toLowerCase();
    if (seen.has(key)) {
      droppedDuplicates += 1;
      continue;
    }
    seen.add(key);

    const cakParsed = parseCakavian(cak);
    const stdParsed = parseStandard(std);
    if (!cakParsed.forms.length || !stdParsed.forms.length) {
      droppedEmpty += 1;
      continue;
    }
    const noteParts = [...stdParsed.notes, ...cakParsed.notes];
    const entry = {
      standard: stdParsed.forms,
      cakavian: cakParsed.forms,
      source: { standard: std, cakavian: cak },
    };
    if (noteParts.length) entry.note = noteParts.join('; ');
    entries.push(entry);
  }

  const standardTerms = new Set();
  for (const entry of entries) {
    for (const form of entry.standard) standardTerms.add(form.toLowerCase());
  }
  for (const [std, cak] of CURATED) {
    if (standardTerms.has(std)) continue;
    entries.push({
      standard: [std],
      cakavian: [cak],
      note: 'Dopuna za gramatičke primjere.',
      source: { standard: std, cakavian: cak },
    });
    standardTerms.add(std);
  }

  entries.sort(compareEntries);

  return {
    dictionary: { metadata: METADATA, entries },
    stats: {
      rawRows: rawRows.length,
      droppedMissing,
      droppedDuplicates,
      droppedEmpty,
      entries: entries.length,
    },
  };
}

export function serialize(dictionary) {
  return JSON.stringify(dictionary, null, 2) + '\n';
}

const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const raw = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const { dictionary, stats } = normalize(raw);
  fs.writeFileSync(OUTPUT_PATH, serialize(dictionary), 'utf8');
  console.log(`Pročitano redaka: ${stats.rawRows}`);
  console.log(`Odbačeno bez polja: ${stats.droppedMissing}`);
  console.log(`Odbačeno dvostrukih parova: ${stats.droppedDuplicates}`);
  console.log(`Odbačeno praznih nakon raščlambe: ${stats.droppedEmpty}`);
  console.log(`Zapisano unosa: ${stats.entries}`);
}

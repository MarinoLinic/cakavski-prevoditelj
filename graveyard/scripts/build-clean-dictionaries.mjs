import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SIMPLE_TERM = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
const TERM_KEYS = ['dialect', 'standard', 'note', 'type', 'origin'];
const TYPE_VALUES = new Set(['', 'particle']);
const ORIGIN_VALUES = new Set(['original', 'synthetic']);
const URL_PATTERN = /(?:https?:\/\/|www\.)\S+|(?:\b[\p{L}\p{N}-]+\.)+(?:com|net|org|edu|gov|hr|io)\b/iu;
const EMAIL_PATTERN = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/iu;
const STANDARD_MAX_WORDS = 3;
const GENERIC_DESCRIPTION_HEADS = new Set([
  'vrsta', 'onaj', 'ono', 'mjesto', 'područje', 'najčešće', 'primjer', 'služi',
  'ostatak', 'zvuk', 'boca', 'učestal', 'dio', 'posuda', 'sprava', 'osoba', 'naziv',
  'uzrečica', 'mjera', 'predmet', 'jelo', 'napitak', 'igra', 'alat', 'alatka', 'način',
  'izraz', 'radnik', 'stanovnik', 'stanovnica', 'skupina', 'razdoblje', 'komad', 'naprava',
  'imenica', 'glagol', 'pridjev', 'prilog', 'riječ', 'u', 'kod', 'za', 'prije', 'prema', 'od',
]);
const DESCRIPTIVE_LEADS = new Set([
  'obično', 'često', 'dugo', 'vrlo', 'najčešće', 'uglavnom', 'posebno',
]);
const BANNED_WORDS = new Set([
  'koji', 'koja', 'koje', 'kojim', 'služi', 'označava', 'koristi', 'naziva', 'gdje',
]);
const STANDALONE_TERM_EXCEPTIONS = new Set(['gdje']);
const CORRECTIONS = new Map([
  ['primjetiti', 'primijetiti'],
  ['sviježe', 'svježe'],
  ['korjen', 'korijen'],
  ['rezervar', 'rezervoar'],
]);
const CURATED = [
  ['staviti', 'stavit'],
  ['popiti', 'popit'],
  ['prošetati', 'špašižat'],
  ['kuća', 'kuća'],
  ['piće', 'piće'],
  ['šank', 'šank'],
  ['dvije', 'dve'],
];
const CURATED_NOTE = 'Kurirana gramatička dopuna.';
const collator = new Intl.Collator('hr');

function clean(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/(?:^|\s)(?:rn)+(?=\s|$)/giu, ' ')
    .replace(/(?:rn)+(?=\s*$)/giu, ' ')
    .replace(URL_PATTERN, ' ')
    .replace(EMAIL_PATTERN, ' ')
    .replace(/[‘’‚‛]/gu, "'")
    .replace(/[“”„‟]/gu, '"')
    .replace(/\s+/gu, ' ')
    .trim();
}

function cleanNote(value) {
  const cleaned = clean(value);
  if (!cleaned) return '';
  const sentences = cleaned.split(/(?<=[.!?])\s+/u)
    .filter((sentence) => !/(?:našem portalu|na nasem portalu|više o tome|vise o tome)/iu.test(sentence));
  let note = sentences.join(' ')
    .replace(/\s+([,.;:!?])/gu, '$1')
    .replace(/,\s*\./gu, '.')
    .replace(/\.\s*,/gu, '. ')
    .replace(/\.{2,}/gu, '.')
    .replace(/([!?]){2,}/gu, '$1')
    .replace(/\s{2,}/gu, ' ')
    .trim();
  if (note.length > 320) {
    const prefix = note.slice(0, 320);
    const boundary = prefix.lastIndexOf(' ');
    note = (boundary > 0 ? prefix.slice(0, boundary) : prefix).trimEnd();
    if (note && !/[.!?]$/u.test(note)) note += '.';
  }
  return note;
}

function extractParentheticals(text) {
  let rest = '';
  let current = '';
  let depth = 0;
  const inner = [];
  for (const char of text) {
    if (char === '(') {
      if (depth > 0) current += char;
      depth += 1;
    } else if (char === ')' && depth > 0) {
      depth -= 1;
      if (depth > 0) current += char;
      else {
        inner.push(current);
        current = '';
      }
    } else if (depth > 0) {
      current += char;
    } else {
      rest += char;
    }
  }
  if (depth > 0) rest += ` ${current}`;
  return { rest: clean(rest), inner: inner.map(clean).filter(Boolean) };
}

function canonicalizeTerm(value) {
  return clean(value)
    .replace(/[.,!?;:]+$/gu, '')
    .replace(/^-+|-+$/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function wordCount(value) {
  return value ? value.split(' ').length : 0;
}

function isSimpleTerm(value, maxWords) {
  return SIMPLE_TERM.test(value) && wordCount(value) <= maxWords;
}

function normalizeKey(value) {
  return value.normalize('NFC').toLocaleLowerCase('hr');
}

function parseDialect(raw) {
  const notes = [];
  const { rest, inner } = extractParentheticals(clean(raw));
  let reflexive = false;
  const extraVariants = [];
  for (const parenthetical of inner) {
    if (normalizeKey(parenthetical) === 'se') {
      reflexive = true;
      continue;
    }
    notes.push(parenthetical);
    const withoutLead = parenthetical.replace(/^(?:ili|isto)\s+/iu, '');
    const term = canonicalizeTerm(withoutLead);
    if (isSimpleTerm(term, 3)) extraVariants.push(term);
  }

  const sourcePieces = rest.split(',').map((piece) => canonicalizeTerm(piece)).filter(Boolean);
  const piecesAreVariants = sourcePieces.length > 1
    && sourcePieces.every((piece) => isSimpleTerm(piece, 4));
  let bases;
  if (piecesAreVariants) {
    bases = sourcePieces;
  } else {
    const first = canonicalizeTerm(rest.split(',')[0]);
    bases = first ? [first] : [];
    if (rest.includes(',')) notes.push(raw);
  }

  const dialects = [];
  for (const base of bases) {
    const punctTrimmed = base.replace(/[?!]+$/gu, '').trim();
    const term = canonicalizeTerm(reflexive ? `${punctTrimmed} se` : punctTrimmed);
    if (isSimpleTerm(term, 6)) dialects.push(term);
    else notes.push(base);
  }
  for (const variant of extraVariants) {
    const term = canonicalizeTerm(reflexive ? `${variant} se` : variant);
    if (isSimpleTerm(term, 6)) dialects.push(term);
  }

  return { dialects: uniqueTerms(dialects), notes };
}

function uniqueTerms(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizeKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasBannedWord(value) {
  return value.split(/[^\p{L}]+/u).some((word) => BANNED_WORDS.has(normalizeKey(word)));
}

function startsWithDialectHead(candidate, dialects) {
  const key = normalizeKey(candidate);
  return dialects.some((dialect) => key.startsWith(`${normalizeKey(dialect)} `));
}

function isDialectInflection(candidate, dialects) {
  if (wordCount(candidate) !== 1) return false;
  const compactCandidate = normalizeKey(candidate).replace(/[ '\u2019-]/gu, '');
  return dialects.some((dialect) => {
    const compactDialect = normalizeKey(dialect).replace(/[ '\u2019-]/gu, '');
    if (compactDialect.length < 5 || compactCandidate === compactDialect) return false;
    let prefixLength = 0;
    while (prefixLength < compactDialect.length
      && prefixLength < compactCandidate.length
      && compactDialect[prefixLength] === compactCandidate[prefixLength]) prefixLength += 1;
    return prefixLength >= Math.max(4, compactDialect.length - 2);
  });
}

function isDescriptiveCandidate(candidate) {
  const firstWord = normalizeKey(candidate.match(/^\p{L}+/u)?.[0] ?? '');
  return GENERIC_DESCRIPTION_HEADS.has(firstWord)
    || (wordCount(candidate) > 1 && DESCRIPTIVE_LEADS.has(firstWord));
}

function parseStandardCandidate(piece, dialects) {
  const unnumbered = piece.replace(/^\s*\d+[.)]?\s*/u, '');
  const term = canonicalizeTerm(unnumbered)
    .replace(/\p{L}+/gu, (word) => CORRECTIONS.get(normalizeKey(word)) ?? word);
  const lower = normalizeKey(term);
  const standaloneException = wordCount(term) === 1 && STANDALONE_TERM_EXCEPTIONS.has(lower);
  const valid = isSimpleTerm(term, STANDARD_MAX_WORDS)
    && !isDescriptiveCandidate(term)
    && (!hasBannedWord(term) || standaloneException)
    && !term.split(/[^\p{L}]+/u).some((word) => normalizeKey(word) === 'npr')
    && !startsWithDialectHead(term, dialects)
    && !isDialectInflection(term, dialects);
  return { term, valid };
}

function splitStandardPieces(value) {
  return value.split(/[.!?;:,]| - /gu).map((piece) => piece.trim()).filter(Boolean);
}

function parseStandard(raw, dialects) {
  const original = clean(raw);
  const { rest, inner } = extractParentheticals(original);
  const firstClauseText = splitStandardPieces(rest)[0] ?? '';
  const firstClause = parseStandardCandidate(firstClauseText, dialects);
  const firstClauseIsDialectHead = firstClause.valid
    && dialects.some((dialect) => normalizeKey(firstClause.term) === normalizeKey(dialect));
  const descriptionFirst = !firstClause.valid && !firstClauseIsDialectHead;
  if (descriptionFirst) return { candidates: [], note: cleanNote(original) };

  const pieces = splitStandardPieces(rest).map((piece) => parseStandardCandidate(piece, dialects));
  const accepted = pieces.filter((piece) => piece.valid).map((piece) => piece.term);
  const rejected = pieces.some((piece) => !piece.valid);
  let candidates = uniqueTerms(accepted);
  if (candidates.some((candidate) => dialects.some((dialect) => normalizeKey(candidate) === normalizeKey(dialect)))
    && candidates.length > 1) {
    const dialectKeys = new Set(dialects.map(normalizeKey));
    candidates = candidates.filter((candidate) => !dialectKeys.has(normalizeKey(candidate)));
  }

  if (rejected) return { candidates, note: cleanNote(original) };
  if (inner.length) return { candidates, note: cleanNote(inner.join('. ')) };
  return { candidates, note: '' };
}

function addRow(rows, row) {
  const key = `${normalizeKey(row.dialect)}\u0000${normalizeKey(row.standard)}`;
  const current = rows.get(key);
  if (!current) {
    rows.set(key, {
      dialect: row.dialect,
      standard: row.standard,
      note: cleanNote(row.note),
      type: row.type ?? '',
      origin: row.origin ?? 'original',
    });
    return;
  }
  const notes = uniqueTerms([current.note, row.note].filter(Boolean));
  current.note = cleanNote(notes.join(' '));
  current.type = current.type === 'particle' || row.type === 'particle' ? 'particle' : '';
  current.origin = current.origin === 'original' || row.origin === 'original' ? 'original' : 'synthetic';
}

function hasRnArtifact(value) {
  return /(?:^|\s)(?:rn)+(?=\s|$)|(?:rn)+$/iu.test(value);
}

function assertCanonical(rows, label) {
  const seen = new Set();
  for (const [index, row] of rows.entries()) {
    assert.deepEqual(Object.keys(row), TERM_KEYS, `${label}[${index}] keys`);
    for (const key of TERM_KEYS) assert.equal(typeof row[key], 'string', `${label}[${index}].${key} type`);
    assert.ok(TYPE_VALUES.has(row.type), `${label}[${index}] invalid type`);
    assert.ok(ORIGIN_VALUES.has(row.origin), `${label}[${index}] invalid origin`);
    assert.ok(row.dialect, `${label}[${index}] dialect is empty`);
    assert.ok(isSimpleTerm(row.dialect, 6), `${label}[${index}] dialect is invalid: ${row.dialect}`);
    assert.ok(!/[\d.!?;:(),]/u.test(row.dialect), `${label}[${index}] dialect punctuation`);
    assert.ok(!URL_PATTERN.test(row.dialect) && !EMAIL_PATTERN.test(row.dialect));
    assert.ok(!hasRnArtifact(row.dialect), `${label}[${index}] dialect rn artifact`);
    assert.ok(!row.dialect.includes('  '), `${label}[${index}] dialect double space`);
    if (row.standard) {
      assert.ok(isSimpleTerm(row.standard, STANDARD_MAX_WORDS), `${label}[${index}] standard is invalid: ${row.standard}`);
      assert.ok(!/[\d.!?;:(),]/u.test(row.standard), `${label}[${index}] standard punctuation`);
      assert.ok(!URL_PATTERN.test(row.standard) && !EMAIL_PATTERN.test(row.standard));
      assert.ok(!hasRnArtifact(row.standard), `${label}[${index}] standard rn artifact`);
      assert.ok(!row.standard.includes('  '), `${label}[${index}] standard double space`);
    }
    assert.ok(!URL_PATTERN.test(row.note) && !EMAIL_PATTERN.test(row.note), `${label}[${index}] note url/email`);
    assert.ok(!hasRnArtifact(row.note), `${label}[${index}] note rn artifact`);
    assert.ok(row.note.length <= 321, `${label}[${index}] note length`);
    const pair = `${normalizeKey(row.dialect)}\u0000${normalizeKey(row.standard)}`;
    assert.ok(!seen.has(pair), `${label}[${index}] duplicate pair`);
    seen.add(pair);
  }
}

function cleanChakavian(sourceRows) {
  const output = new Map();
  for (const sourceRow of sourceRows) {
    const dialectParsed = parseDialect(sourceRow.cakavski);
    if (!dialectParsed.dialects.length) continue;
    const glossParsed = parseStandard(sourceRow.stokavski, dialectParsed.dialects);
    const notePieces = uniqueTerms([...dialectParsed.notes, glossParsed.note].filter(Boolean));
    const note = cleanNote(notePieces.join('. '));
    const standards = glossParsed.candidates;
    for (const dialect of dialectParsed.dialects) {
      if (standards.length) {
        for (const standard of standards) {
          const type = normalizeKey(dialect) === 'ši' && normalizeKey(standard) === 'da' ? 'particle' : '';
          addRow(output, { dialect, standard, note, type, origin: 'original' });
        }
      } else {
        addRow(output, { dialect, standard: '', note: cleanNote(note || sourceRow.stokavski), type: '', origin: 'original' });
      }
    }
  }

  for (const [standard, dialect] of CURATED) {
    const pairKey = `${normalizeKey(dialect)}\u0000${normalizeKey(standard)}`;
    if (!output.has(pairKey)) addRow(output, { dialect, standard, note: CURATED_NOTE, type: '', origin: 'synthetic' });
  }

  const rows = [...output.values()].sort((a, b) => collator.compare(a.dialect, b.dialect)
    || collator.compare(a.standard, b.standard));
  assertCanonical(rows, 'Čakavski rječnik');
  const particles = rows.filter((row) => row.type === 'particle');
  assert.equal(particles.length, 1);
  assert.equal(particles[0].dialect, 'ši');
  assert.equal(particles[0].standard, 'da');
  assert.equal(particles[0].origin, 'original');
  assert.ok(rows.some((row) => row.origin === 'original'));
  assert.ok(rows.some((row) => row.origin === 'synthetic'));
  return rows;
}

function cleanDalmatian(sourceRows) {
  const rows = sourceRows.map((entry, index) => {
    if (Array.isArray(entry.standard)) {
      assert.equal(entry.standard.length, 1, `Dalmatian source ${index} standard forms`);
      assert.equal(entry.dialect.length, 1, `Dalmatian source ${index} dialect forms`);
      return { dialect: entry.dialect[0], standard: entry.standard[0], note: '', type: '', origin: 'synthetic' };
    }
    return { dialect: entry.dialect, standard: entry.standard, note: '', type: '', origin: 'synthetic' };
  });
  assertCanonical(rows, 'Dalmatinska ikavica');
  assert.ok(rows.every((row) => row.origin === 'synthetic'));
  return rows;
}

const sourceChakavianPath = [
  path.join(ROOT, 'data', 'source-chakavian.json'),
  path.join(ROOT, 'graveyard', 'data', 'source-chakavian.json'),
].find((candidate) => fs.existsSync(candidate));
const sourceChakavian = JSON.parse(fs.readFileSync(sourceChakavianPath, 'utf8'));
const dalmatianInput = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dalmatian.json'), 'utf8'));
const sourceDalmatian = Array.isArray(dalmatianInput)
  ? dalmatianInput.map((entry) => ({ standard: [entry.standard], dialect: [entry.dialect] }))
  : dalmatianInput.entries;
const chakavian = cleanChakavian(sourceChakavian);
const dalmatian = cleanDalmatian(sourceDalmatian);
fs.writeFileSync(path.join(ROOT, 'data', 'chakavian.json'), `${JSON.stringify(chakavian, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(ROOT, 'data', 'dalmatian.json'), `${JSON.stringify(dalmatian, null, 2)}\n`, 'utf8');
console.log(`Čakavskih redaka zapisano: ${chakavian.length}`);
console.log(`Dalmatian rows written: ${dalmatian.length}`);

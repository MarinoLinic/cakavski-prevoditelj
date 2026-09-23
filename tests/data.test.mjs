import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dictionaries = [
  ['Čakavski', JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cakavian.json'), 'utf8'))],
  ['Dalmatinski', JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dalmatian.json'), 'utf8'))],
];
const SIMPLE_TERM = /^\p{L}+(?:[ '\u2019-]\p{L}+)*$/u;
const RN_ARTIFACT = /(?:^|\s)(?:rn)+(?=\s|$)|(?:rn)+$/iu;
const URL_OR_EMAIL = /(?:https?:\/\/|www\.)\S+|(?:\b[\p{L}\p{N}-]+\.)+(?:com|net|org|edu|gov|hr|io)\b|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/iu;
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
const FORBIDDEN_TERMS = ['Ala homo', 'Na Grobniku', 'našem portalu', 'rnrn', 'Npr', '!', '?', '(', ')'];
const FORBIDDEN_STANDARDS = [
  'akužaš', 'akužaju', 'primjer', 'obično se daje stoci', 'dugo kuhane s mirodijama', 'vina', 'ulja',
  'imenica muškoga roda', 'prije uporabe ulja', 'u množini',
];

for (const [label, rows] of dictionaries) {
  test(`${label}: shema, oblici, bilješke i parovi zadovoljavaju kanonske uvjete`, () => {
    assert.ok(Array.isArray(rows));
    const pairs = new Set();
    for (const [index, row] of rows.entries()) {
      assert.deepEqual(Object.keys(row), ['dialect', 'standard', 'note', 'type', 'origin'], `${label}[${index}] keys`);
      assert.equal(typeof row.dialect, 'string');
      assert.equal(typeof row.standard, 'string');
      assert.equal(typeof row.note, 'string');
      assert.equal(typeof row.type, 'string');
      assert.equal(typeof row.origin, 'string');
      assert.ok(['', 'particle'].includes(row.type));
      assert.ok(['original', 'synthetic'].includes(row.origin));
      assert.ok(row.dialect.length > 0);
      assert.ok(SIMPLE_TERM.test(row.dialect));
      assert.ok(row.dialect.split(' ').length <= 6);
      if (row.standard) {
        assert.ok(SIMPLE_TERM.test(row.standard));
        assert.ok(row.standard.split(' ').length <= 3);
        const words = row.standard.split(' ');
        const firstWord = words[0].toLocaleLowerCase('hr');
        if (label === 'Čakavski') {
          assert.ok(!GENERIC_DESCRIPTION_HEADS.has(firstWord));
          assert.ok(words.length === 1 || !DESCRIPTIVE_LEADS.has(firstWord));
        }
      }
      for (const term of [row.dialect, row.standard].filter(Boolean)) {
        assert.ok(!/[\d.!?;:(),]/u.test(term));
        assert.ok(!URL_OR_EMAIL.test(term));
        assert.ok(!RN_ARTIFACT.test(term));
        assert.ok(!term.includes('  '));
      }
      assert.ok(!URL_OR_EMAIL.test(row.note));
      assert.ok(!RN_ARTIFACT.test(row.note));
      assert.ok(row.note.length <= 321);
      assert.ok(!row.note.includes('..'));
      assert.ok(!row.note.includes(',.'));
      assert.ok(!row.note.includes('.,'));
      const key = `${row.dialect.normalize('NFC').toLocaleLowerCase('hr')}\u0000${row.standard.normalize('NFC').toLocaleLowerCase('hr')}`;
      assert.ok(!pairs.has(key), `${label}[${index}] duplicate pair`);
      pairs.add(key);
    }
  });
}

test('problematični izrazi iz izvora nisu pretraživi oblici', () => {
  const cakavianRows = dictionaries[0][1];
  const ozvirchiRows = cakavianRows.filter((row) => row.dialect.toLocaleLowerCase('hr') === 'ozvirchi');
  assert.ok(ozvirchiRows.length > 0);
  for (const row of ozvirchiRows) assert.equal(row.standard, '');
  const particles = cakavianRows.filter((row) => row.type === 'particle');
  assert.equal(particles.length, 1);
  assert.deepEqual(particles[0], {
    dialect: 'ši', standard: 'da', note: '', type: 'particle', origin: 'original',
  });
  assert.ok(cakavianRows.some((row) => row.origin === 'original'));
  assert.ok(cakavianRows.some((row) => row.origin === 'synthetic'));
  assert.ok(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dalmatian.json'), 'utf8'))
    .every((row) => row.origin === 'synthetic'));
  assert.ok(cakavianRows.some((row) => row.standard === ''));
  for (const [, rows] of dictionaries) {
    for (const row of rows) {
      for (const term of [row.dialect, row.standard]) {
        for (const forbidden of FORBIDDEN_TERMS) {
          assert.ok(!term.toLocaleLowerCase('hr').includes(forbidden.toLocaleLowerCase('hr')), `${term} contains ${forbidden}`);
        }
      }
    }
  }
  for (const row of cakavianRows) {
    for (const forbidden of FORBIDDEN_STANDARDS) {
      assert.notEqual(row.standard.toLocaleLowerCase('hr'), forbidden.toLocaleLowerCase('hr'));
    }
    assert.notEqual(row.dialect.toLocaleLowerCase('hr'), 'ili ozvirchi');
  }
});

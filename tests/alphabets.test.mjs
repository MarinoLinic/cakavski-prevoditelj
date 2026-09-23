import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABETS, transliterate, toLatin, getAlphabetEntries } from '../js/alphabets.js';

test('ALPHABETS navodi tri pisma', () => {
  assert.deepEqual(ALPHABETS, ['latin', 'glagolitic', 'cyrillic']);
});

test('latinica u ćirilicu: Ljubičasti džep', () => {
  assert.equal(transliterate('Ljubičasti džep', 'latin', 'cyrillic'), 'Љубичасти џеп');
});

test('ćirilica se vraća u izvorni tekst', () => {
  const original = 'Ljubičasti džep';
  const round = transliterate(transliterate(original, 'latin', 'cyrillic'), 'cyrillic', 'latin');
  assert.equal(round, original);
});

test('latinica u glagoljicu: ča', () => {
  assert.equal(transliterate('ča', 'latin', 'glagolitic'), 'ⰝⰀ');
});

test('glagoljica se vraća u mala slova', () => {
  const round = transliterate(transliterate('ča', 'latin', 'glagolitic'), 'glagolitic', 'latin');
  assert.equal(round, 'ča');
});

test('interpunkcija i razmaci prolaze netaknuti', () => {
  assert.equal(transliterate('ča,  kade?\nborša!', 'latin', 'cyrillic'), 'ча,  каде?\nборша!');
  assert.equal(transliterate('ča,  kade?\nborša!', 'latin', 'glagolitic'), 'ⰝⰀ,  ⰍⰀⰄⰅ?\nⰁⰑⰓⰞⰀ!');
});

test('toLatin normalizira ulaz', () => {
  assert.equal(toLatin('ča', 'latin'), 'ča');
  assert.equal(toLatin('ча', 'cyrillic'), 'ča');
  assert.equal(toLatin('ⰝⰀ', 'glagolitic'), 'ča');
});

test('transliteracija između dva nelatinična pisma prolazi kroz latinicu', () => {
  const cyrillic = transliterate('ča', 'latin', 'cyrillic');
  assert.equal(transliterate('ča', 'latin', 'glagolitic'), transliterate(cyrillic, 'cyrillic', 'glagolitic'));
});

test('alfabetski pregled izlaže preslikavanja bez metapodataka izvora', () => {
  assert.ok(getAlphabetEntries('latin').some((entry) => entry.source === 'č' && entry.target === 'č'));
  assert.ok(getAlphabetEntries('cyrillic').some((entry) => entry.source === 'lj' && entry.target === 'љ'));
  assert.ok(getAlphabetEntries('glagolitic').some((entry) => entry.source === 'dž' && entry.target === 'ⰄⰆ'));
  assert.deepEqual(Object.keys(getAlphabetEntries('latin')[0]).sort(), ['source', 'target']);
});

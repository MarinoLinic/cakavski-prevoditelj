import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPHABETS, transliterate, toLatin, getAlphabetEntries, getAlphabetDirection } from '../js/alphabets.js';

const ROUND_TRIP_TEXT = 'a b c č ć d dž đ e f g h i j k l lj m n nj o p r s š t u v z ž';

test('ALPHABETS navodi osam pisama zadanim redom', () => {
  assert.deepEqual(ALPHABETS, [
    'latin', 'glagolitic', 'cyrillic', 'arebica', 'hebrew', 'georgian', 'hieroglyphs', 'linear-b',
  ]);
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

test('arebica koristi preslikavanje Bosanske arebice i vraća ulaz', () => {
  assert.equal(transliterate('čćž', 'latin', 'arebica'), 'چڃژ');
  const encoded = transliterate(ROUND_TRIP_TEXT, 'latin', 'arebica');
  assert.equal(toLatin(encoded, 'arebica'), ROUND_TRIP_TEXT);
});

test('hebrejski mapira grapheme i vraća ulaz', () => {
  assert.equal(transliterate('čćž', 'latin', 'hebrew'), 'צ׳ט׳ז׳');
  const encoded = transliterate(ROUND_TRIP_TEXT, 'latin', 'hebrew');
  assert.equal(toLatin(encoded, 'hebrew'), ROUND_TRIP_TEXT);
});

test('gruzijski mapira grapheme i vraća ulaz', () => {
  assert.equal(transliterate('čćž', 'latin', 'georgian'), 'ჩჭჟ');
  const encoded = transliterate(ROUND_TRIP_TEXT, 'latin', 'georgian');
  assert.equal(toLatin(encoded, 'georgian'), ROUND_TRIP_TEXT);
});

test('hijeroglifi su reverzibilna zamjena bez latiničnih slova', () => {
  const encoded = transliterate(ROUND_TRIP_TEXT, 'latin', 'hieroglyphs');
  assert.doesNotMatch(encoded, /[A-Za-z]/u);
  assert.equal(toLatin(encoded, 'hieroglyphs'), ROUND_TRIP_TEXT);
});

test('Linear B je reverzibilna zamjena bez latiničnih slova', () => {
  const encoded = transliterate(ROUND_TRIP_TEXT, 'latin', 'linear-b');
  assert.doesNotMatch(encoded, /[A-Za-z]/u);
  assert.equal(toLatin(encoded, 'linear-b'), ROUND_TRIP_TEXT);
});

test('smjer pisma razlikuje samo Arebicu i hebrejski', () => {
  assert.equal(getAlphabetDirection('arebica'), 'rtl');
  assert.equal(getAlphabetDirection('hebrew'), 'rtl');
  for (const id of ALPHABETS.filter((alphabet) => !['arebica', 'hebrew'].includes(alphabet))) {
    assert.equal(getAlphabetDirection(id), 'ltr');
  }
});

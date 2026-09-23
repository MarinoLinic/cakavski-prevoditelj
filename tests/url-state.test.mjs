import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_URL_STATE, parseUrlState, serializeUrlState } from '../js/url-state.js';

test('nedostajući parametri vraćaju zadane vrijednosti', () => {
  assert.deepEqual(parseUrlState(''), DEFAULT_URL_STATE);
  assert.deepEqual(parseUrlState('?theme=light'), { ...DEFAULT_URL_STATE, theme: 'light' });
});

test('serijalizacija uvijek piše svih pet parametara zadanim redom', () => {
  assert.equal(
    serializeUrlState(DEFAULT_URL_STATE),
    '?from=standard&to=chakavian&fromAlphabet=latin&toAlphabet=latin&theme=dark',
  );
});

test('nevaljane vrijednosti zamjenjuju se zadanim vrijednostima', () => {
  assert.deepEqual(
    parseUrlState('?from=other&to=dalmatian&fromAlphabet=runic&toAlphabet=cyrillic&theme=blue'),
    { ...DEFAULT_URL_STATE, to: 'dalmatian', toAlphabet: 'cyrillic' },
  );
});

test('stanje se može kružno pročitati i zapisati uz nova pisma', () => {
  const state = {
    from: 'chakavian',
    to: 'dalmatian',
    fromAlphabet: 'arebica',
    toAlphabet: 'linear-b',
    theme: 'light',
  };
  const query = serializeUrlState(state);
  assert.deepEqual(parseUrlState(query), state);
  assert.equal(query, '?from=chakavian&to=dalmatian&fromAlphabet=arebica&toAlphabet=linear-b&theme=light');
});

test('svih osam identifikatora pisma ostaje valjano', () => {
  const alphabets = ['latin', 'glagolitic', 'cyrillic', 'arebica', 'hebrew', 'georgian', 'hieroglyphs', 'linear-b'];
  for (const alphabet of alphabets) {
    const state = { ...DEFAULT_URL_STATE, fromAlphabet: alphabet, toAlphabet: alphabet };
    assert.deepEqual(parseUrlState(serializeUrlState(state)), state);
  }
});

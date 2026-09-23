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
    '?from=standard&to=cakavian&fromAlphabet=latin&toAlphabet=latin&theme=dark',
  );
});

test('nevaljane vrijednosti zamjenjuju se zadanim vrijednostima', () => {
  assert.deepEqual(
    parseUrlState('?from=other&to=dalmatian&fromAlphabet=runic&toAlphabet=cyrillic&theme=blue'),
    { ...DEFAULT_URL_STATE, to: 'dalmatian', toAlphabet: 'cyrillic' },
  );
});

test('stanje se može kružno pročitati i zapisati', () => {
  const state = {
    from: 'dalmatian',
    to: 'cakavian',
    fromAlphabet: 'cyrillic',
    toAlphabet: 'glagolitic',
    theme: 'light',
  };
  const query = serializeUrlState(state);
  assert.deepEqual(parseUrlState(query), state);
  assert.equal(query, '?from=dalmatian&to=cakavian&fromAlphabet=cyrillic&toAlphabet=glagolitic&theme=light');
});

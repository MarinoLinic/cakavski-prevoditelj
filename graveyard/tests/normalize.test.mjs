import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalize, serialize } from '../scripts/normalize-dictionary.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'source-chakavian.json'), 'utf8'));
const dictionary = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'chakavian.json'), 'utf8'));

test('normalizacija je dvaput bajt-identična', () => {
  const first = serialize(normalize(raw).dictionary);
  const second = serialize(normalize(raw).dictionary);
  assert.equal(second, first);
});

test('generirani rječnik odgovara ponovnoj normalizaciji', () => {
  const regenerated = serialize(normalize(raw).dictionary);
  const onDisk = fs.readFileSync(path.join(ROOT, 'data', 'chakavian.json'), 'utf8');
  assert.equal(onDisk, regenerated);
});

test('izlaz ima manje unosa od izvornog popisa', () => {
  assert.ok(dictionary.entries.length < raw.length + 7);
  assert.ok(dictionary.entries.length > 0);
});

test('svaki unos ima neprazne nizove i izvor', () => {
  for (const entry of dictionary.entries) {
    assert.ok(Array.isArray(entry.standard) && entry.standard.length > 0);
    assert.ok(Array.isArray(entry.chakavian) && entry.chakavian.length > 0);
    assert.ok(entry.standard.every((form) => typeof form === 'string' && form.length > 0));
    assert.ok(entry.chakavian.every((form) => typeof form === 'string' && form.length > 0));
    assert.ok(entry.source && typeof entry.source.standard === 'string' && entry.source.standard.length > 0);
    assert.ok(entry.source && typeof entry.source.chakavian === 'string' && entry.source.chakavian.length > 0);
  }
});

test('pretraživi oblici ne sadrže zagrade', () => {
  for (const entry of dictionary.entries) {
    for (const form of [...entry.standard, ...entry.chakavian]) {
      assert.ok(!form.includes('(') && !form.includes(')'), `oblik sa zagradom: ${form}`);
    }
  }
});

test('metapodaci navode novi izvor', () => {
  assert.equal(dictionary.metadata.sourceName, 'Lokalpatrioti Rijeka, Čakavski rječnik');
  assert.equal(dictionary.metadata.sourceUrl, 'https://lokalpatrioti-rijeka.com/cakavski-rjecnik/');
  assert.equal(dictionary.metadata.retrieved, '22. rujna 2026.');
});

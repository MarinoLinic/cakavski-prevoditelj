import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTranslator } from '../js/translator.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chakavian = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'chakavian.json'), 'utf8'));
const dalmatian = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dalmatian.json'), 'utf8'));
const samples = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'samples.json'), 'utf8'));
const translator = createTranslator({ chakavian, dalmatian, random: () => 0 });
const punctuation = (text) => [...text].filter((char) => /\p{P}/u.test(char)).join('');

test('datoteka sadrži 20 duljih primjera s naslovom i tekstom', () => {
  assert.equal(samples.length, 20);
  for (const sample of samples) {
    assert.ok(sample.title && sample.text);
    assert.ok(sample.text.length > 120, sample.title);
  }
});

test('svi primjeri prevode se u oba regionalna profila', () => {
  for (const sample of samples) {
    for (const target of ['chakavian', 'dalmatian']) {
      const output = translator.translate(sample.text, 'standard', target);
      assert.ok(output.length > 0, `${sample.title}: ${target}`);
      assert.equal(punctuation(output), punctuation(sample.text), `${sample.title}: ${target}`);
    }
  }
});

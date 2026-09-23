import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTranslator, preserveCase } from '../js/translator.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cakavian = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'cakavian.json'), 'utf8'));
const dalmatian = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'dalmatian.json'), 'utf8'));
const translator = createTranslator({ cakavian, dalmatian, random: () => 0 });

test('Što je na stolu? prevede se u Ča je na tavoli?', () => {
  assert.equal(translator.translate('Što je na stolu?', 'standard', 'cakavian'), 'Ča je na tavoli?');
});

test('akuzativ nakon na: Stavio je torbu na stol.', () => {
  assert.equal(
    translator.translate('Stavio je torbu na stol.', 'standard', 'cakavian'),
    'Stavil je boršu na tavolu.',
  );
});

test('glagolski parovi: Popio je piće i prošetao se.', () => {
  assert.equal(
    translator.translate('Popio je piće i prošetao se.', 'standard', 'cakavian'),
    'Popil je piće i špašižal se.',
  );
});

test('prva osoba sadašnjeg: Stavim torbu na stol.', () => {
  assert.equal(
    translator.translate('Stavim torbu na stol.', 'standard', 'cakavian'),
    'Stavin boršu na tavolu.',
  );
});

test('interpunkcija i razmaci se čuvaju točno', () => {
  assert.equal(
    translator.translate('Što,  gdje?\nTorba!', 'standard', 'cakavian'),
    'Ča,  kade?\nBorša!',
  );
});

test('obrnuti smjer: Ča je na tavoli? u Što je na stolu?', () => {
  assert.equal(translator.translate('Ča je na tavoli?', 'cakavian', 'standard'), 'Što je na stolu?');
});

test('veličina slova se čuva', () => {
  assert.equal(
    translator.translate('TORBA Torba torba', 'standard', 'cakavian'),
    'BORŠA Borša borša',
  );
});

test('isti jezik daje identitet', () => {
  const text = 'Ovo ostaje isto.';
  assert.equal(translator.translate(text, 'standard', 'standard'), text);
  assert.equal(translator.translate(text, 'cakavian', 'cakavian'), text);
  assert.equal(translator.translate(text, 'dalmatian', 'dalmatian'), text);
});

test('inspect vraća broj promijenjenih tokena i segmente', () => {
  const result = translator.inspect('Stavio je torbu na stol.', 'standard', 'cakavian');
  assert.equal(result.text, 'Stavil je boršu na tavolu.');
  assert.equal(result.changed, 3);
  assert.ok(result.matched >= 3);
  assert.equal(result.segments.map((segment) => segment.text).join(''), result.text);
  assert.equal(result.segments.filter((segment) => segment.changed).length, 3);
});

test('preserveCase pokriva sva slova, početno i malo', () => {
  assert.equal(preserveCase('TORBA', 'borša'), 'BORŠA');
  assert.equal(preserveCase('Torba', 'borša'), 'Borša');
  assert.equal(preserveCase('torba', 'borša'), 'borša');
});

test('šetati koristi rječnički par špašižat', () => {
  assert.equal(translator.translate('šetati', 'standard', 'cakavian'), 'špašižat');
});

test('kratke funkcijske riječi ne ulaze u imeničke paradigme', () => {
  assert.equal(translator.translate('do kuće', 'standard', 'cakavian'), 'do kuće');
});

test('pridjevi se ne sklanjaju kao imenice', () => {
  assert.equal(
    translator.translate('Na velikom stolu.', 'standard', 'cakavian'),
    'Na velikon tavoli.',
  );
  assert.equal(translator.translate('malu uvalu', 'standard', 'cakavian'), 'malu uvalu');
});

test('cijeli korisnikov primjer čuva prijedlog i prevodi oblike', () => {
  assert.equal(
    translator.translate(
      'Roko je stavio torbu na stol, popio piće, stavio dvije boce vode na šank i prošetao se do kuće.',
      'standard',
      'cakavian',
    ),
    'Roko je stavil boršu na tavolu, popil piće, stavil dve boce vode na šank i špašižal se do kuće.',
  );
});

test('u opisu posude navedene tekućine ostaju netaknute', () => {
  assert.equal(translator.translate('čašu vina i ulja', 'standard', 'cakavian'), 'žmuj vina i ulja');
});

test('sinonimi ne stvaraju lažne imeničke oblike', () => {
  const output = translator.translate('s punom vrećicom', 'standard', 'cakavian');
  assert.ok(!output.includes('čudom'));
});

test('dalmatinski infinitivni fallback ne krati pridjev siti', () => {
  assert.equal(translator.translate('siti', 'standard', 'dalmatian'), 'siti');
});

test('prijevod u dalmatinsku ikavicu traži točne parove', () => {
  assert.equal(translator.translate('Lijepo vrijeme i dvije riječi.', 'standard', 'dalmatian'), 'Lipo vrime i dvi riči.');
  assert.equal(translator.translate('Vidio sam djecu na tržnici.', 'standard', 'dalmatian'), 'Vidija san dicu na pazaru.');
  assert.equal(translator.translate('Popio sam mlijeko i otišao.', 'standard', 'dalmatian'), 'Popija san mliko i otiša.');
  assert.equal(translator.translate('Lipo vrime.', 'dalmatian', 'standard'), 'Lijepo vrijeme.');
});

test('čakavski i dalmatinski prevode se preko standardnog uz očuvanu interpunkciju', () => {
  const text = 'Ča je lipo!';
  const output = translator.translate(text, 'cakavian', 'dalmatian');
  assert.equal([...output].filter((char) => /\p{P}/u.test(char)).join(''), '!');
  assert.ok(output.length > 0);
});

test('segmenti pokrivaju izlaz, a razdjelnici nisu označeni', () => {
  const result = translator.inspect('TORBA, torba!  ', 'standard', 'cakavian');
  assert.equal(result.segments.map((segment) => segment.text).join(''), result.text);
  assert.equal(result.changed, 2);
  assert.equal(result.segments.filter((segment) => segment.changed).length, 2);
  assert.ok(result.segments.filter((segment) => /[^\p{L}\s]/u.test(segment.text)).every((segment) => !segment.changed));
  assert.ok(result.segments.some((segment) => segment.text.includes(',') && !segment.changed));
  assert.ok(result.segments.some((segment) => segment.text.includes('!') && !segment.changed));
});

test('rječnik se može pregledavati za tri jezika', () => {
  assert.ok(translator.getLexicon('cakavian').some((entry) => entry.source === 'torba' && entry.target === 'borša'));
  assert.ok(translator.getLexicon('dalmatian').some((entry) => entry.source === 'riječ' && entry.target === 'rič'));
  assert.ok(translator.getLexicon('standard').some((entry) => entry.profile === 'Čakavski'));
  assert.ok(translator.getLexicon('standard').some((entry) => entry.profile === 'Dalmatinska ikavica'));
});

test('standalone particle se prevodi samo kao zaseban iskaz', () => {
  assert.equal(translator.translate('da', 'standard', 'cakavian'), 'ši');
  assert.equal(translator.translate('Da!', 'standard', 'cakavian'), 'Ši!');
  const sentence = translator.translate('Mislim da dolazi.', 'standard', 'cakavian');
  assert.equal([...sentence.matchAll(/\p{L}+/gu)].map((match) => match[0])[1], 'da');
  assert.equal(translator.translate('ši', 'cakavian', 'standard'), 'da');
  assert.equal(translator.translate('reka ši', 'cakavian', 'standard'), 'reka ši');
});

test('dvosmislen izbor ostaje stabilan za sesiju i mijenja se početnim nasumičnim izborom', () => {
  const choices = [
    { dialect: 'prvi', standard: 'test', note: '', type: '', origin: 'original' },
    { dialect: 'drugi', standard: 'test', note: '', type: '', origin: 'original' },
  ];
  const first = createTranslator({ cakavian: choices, dalmatian: [], random: () => 0 });
  const last = createTranslator({ cakavian: choices, dalmatian: [], random: () => 0.999 });
  assert.equal(first.translate('test', 'standard', 'cakavian'), 'prvi');
  assert.equal(first.translate('test', 'standard', 'cakavian'), 'prvi');
  assert.equal(last.translate('test', 'standard', 'cakavian'), 'drugi');
  assert.equal(last.translate('test', 'standard', 'cakavian'), 'drugi');
});

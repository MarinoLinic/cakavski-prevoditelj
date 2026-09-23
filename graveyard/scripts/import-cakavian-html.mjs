import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = process.argv[2] ?? 'C:\\Users\\marin\\Downloads\\cakavski.html';
const legacyPath = process.argv[3] ?? path.join(ROOT, 'data', 'source-cakavian-legacy.json');
const outputPath = path.join(ROOT, 'data', 'source-cakavian.json');

const ranges = [
  ['cabibo', 'cuciar'],
  ["d'Egito", 'Drizar'],
  ["S' ciopar", 'Suto'],
  ['Zaba', 'Zito'],
];

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  hellip: '…', copy: '©', reg: '®', trade: '™', eacute: 'é', Eacute: 'É',
  aacute: 'á', Aacute: 'Á', iacute: 'í', Iacute: 'Í', oacute: 'ó', Oacute: 'Ó',
  uacute: 'ú', Uacute: 'Ú', ccaron: 'č', Ccaron: 'Č', scaron: 'š', Scaron: 'Š',
  zcaron: 'ž', Zcaron: 'Ž', cacute: 'ć', Cacute: 'Ć', dstrok: 'đ', Dstrok: 'Đ',
};

function decodeEntities(text) {
  return text.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][a-z\d]+);/gi, (entity, key) => {
    if (key[0] === '#') {
      const hex = key[1]?.toLowerCase() === 'x';
      const value = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : entity;
    }
    return ENTITIES[key] ?? entity;
  });
}

function textContent(markup) {
  return decodeEntities(markup
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .normalize('NFC');
}

function extractRows(html) {
  const listPattern = /<ul\b(?=[^>]*\bclass\s*=\s*["'][^"']*\blpr-dictionary-list\b)[^>]*>([\s\S]*?)<\/ul\s*>/gi;
  const rows = [];
  for (const listMatch of html.matchAll(listPattern)) {
    for (const liMatch of listMatch[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi)) {
      const item = liMatch[1];
      const strong = item.match(/<strong\b[^>]*>([\s\S]*?)<\/strong\s*>/i);
      if (!strong) continue;
      const cakavski = textContent(strong[1]).replace(/:\s*$/, '').trim();
      if (!cakavski) continue;
      const remainder = item.replace(strong[0], ' ');
      const stokavski = textContent(remainder);
      rows.push({ cakavski, stokavski });
    }
  }
  return rows;
}

function excludeFiuman(rows) {
  const skipped = new Set();
  let activeRange = null;
  for (const row of rows) {
    if (activeRange) {
      skipped.add(row);
      if (row.cakavski === activeRange[1]) activeRange = null;
      continue;
    }
    const range = ranges.find(([start]) => row.cakavski === start);
    if (range) {
      activeRange = range;
      skipped.add(row);
      if (row.cakavski === range[1]) activeRange = null;
    }
  }
  return { rows: rows.filter((row) => !skipped.has(row)), excluded: skipped.size };
}

function fold(value) {
  return value.normalize('NFC').toLocaleLowerCase('hr');
}

const html = fs.readFileSync(htmlPath, 'utf8');
const parsedRows = extractRows(html);
const liveHeads = new Set(parsedRows.map((row) => fold(row.cakavski)));
const { rows: liveRows, excluded } = excludeFiuman(parsedRows);
const legacyRows = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
const legacyHeads = new Set();
const legacyAddedRows = [];
for (const row of legacyRows) {
  const head = (row.cakavski ?? '').normalize('NFC').trim();
  const key = fold(head);
  if (!head || liveHeads.has(key) || legacyHeads.has(key)) continue;
  legacyHeads.add(key);
  legacyAddedRows.push({ cakavski: head, stokavski: row.stokavski ?? '' });
}
const output = [...liveRows, ...legacyAddedRows];
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`Parsed rows: ${parsedRows.length}`);
console.log(`Excluded Fiuman rows: ${excluded}`);
console.log(`Legacy-only headwords added: ${legacyAddedRows.length}`);
console.log(`Output rows: ${output.length}`);

export const ALPHABETS = ['latin', 'glagolitic', 'cyrillic', 'arebica', 'hebrew', 'georgian', 'hieroglyphs', 'linear-b'];

const CROATIAN_GRAPHEMES = [
  'dž', 'lj', 'nj', 'a', 'b', 'c', 'č', 'ć', 'd', 'đ', 'e', 'f', 'g', 'h',
  'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 'š', 't', 'u', 'v', 'z', 'ž',
];

const CYRILLIC = {
  'dž': 'џ', lj: 'љ', nj: 'њ',
  a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е',
  f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у',
  v: 'в', z: 'з', ž: 'ж',
};

const GLAGOLITIC = {
  a: 'Ⰰ', b: 'Ⰱ', c: 'Ⱌ', č: 'Ⱍ', ć: 'Ⱋ', d: 'Ⰴ', đ: 'Ⰼ', e: 'Ⰵ',
  f: 'Ⱇ', g: 'Ⰳ', h: 'Ⱈ', i: 'Ⰹ', j: 'Ⰻ', k: 'Ⰽ', l: 'Ⰾ', m: 'Ⰿ',
  n: 'Ⱀ', o: 'Ⱁ', p: 'Ⱂ', r: 'Ⱃ', s: 'Ⱄ', š: 'Ⱎ', t: 'Ⱅ', u: 'Ⱆ',
  v: 'Ⰲ', z: 'Ⰸ', ž: 'Ⰶ',
};

const GLAGOLITIC_MAP = {
  'dž': GLAGOLITIC.d + GLAGOLITIC.ž,
  lj: GLAGOLITIC.l + GLAGOLITIC.j,
  nj: GLAGOLITIC.n + GLAGOLITIC.j,
  ...GLAGOLITIC,
};

const AREBICA = {
  'dž': 'ج', lj: 'ڵ', nj: 'ݩ',
  a: 'آ', b: 'ب', c: 'ڄ', č: 'چ', ć: 'ڃ', d: 'د', đ: 'ݗ', e: 'ە',
  f: 'ف', g: 'غ', h: 'ح', i: 'اى', j: 'ي', k: 'ق', l: 'ل', m: 'م',
  n: 'ن', o: 'ۉ', p: 'پ', r: 'ر', s: 'س', š: 'ش', t: 'ت', u: 'ۆ',
  v: 'و', z: 'ز', ž: 'ژ',
};

const HEBREW = {
  'dž': 'ג׳', lj: 'ל׳', nj: 'נ׳',
  a: 'אַ', b: 'ב', c: 'צ', č: 'צ׳', ć: 'ט׳', d: 'ד', đ: 'ד׳', e: 'אֶ',
  f: 'פ', g: 'ג', h: 'ה', i: 'אִ', j: 'י', k: 'כ', l: 'ל', m: 'מ',
  n: 'נ', o: 'אֹ', p: 'פּ', r: 'ר', s: 'ס', š: 'ש', t: 'ת', u: 'אֻ',
  v: 'ו', z: 'ז', ž: 'ז׳',
};

const GEORGIAN = {
  'dž': 'ჯ', lj: 'ლჲ', nj: 'ნჲ',
  a: 'ა', b: 'ბ', c: 'ც', č: 'ჩ', ć: 'ჭ', d: 'დ', đ: 'ძ', e: 'ე',
  f: 'ფ', g: 'გ', h: 'ჰ', i: 'ი', j: 'ჲ', k: 'კ', l: 'ლ', m: 'მ',
  n: 'ნ', o: 'ო', p: 'პ', r: 'რ', s: 'ს', š: 'შ', t: 'ტ', u: 'უ',
  v: 'ვ', z: 'ზ', ž: 'ჟ',
};

const HIEROGLYPH_SYMBOLS = [
  '𓀀', '𓀁', '𓀂', '𓀃', '𓀄', '𓀅', '𓀆', '𓀇', '𓀈', '𓀉',
  '𓀊', '𓀋', '𓀌', '𓀍', '𓀎', '𓀏', '𓀐', '𓀑', '𓀒', '𓀓',
  '𓀔', '𓀕', '𓀖', '𓀗', '𓀘', '𓀙', '𓀚', '𓀛', '𓀜', '𓀝',
];

const LINEAR_B_SYMBOLS = [
  '𐀀', '𐀁', '𐀂', '𐀃', '𐀄', '𐀅', '𐀆', '𐀇', '𐀈', '𐀉',
  '𐀊', '𐀋', '𐀍', '𐀎', '𐀏', '𐀐', '𐀑', '𐀒', '𐀓', '𐀔',
  '𐀕', '𐀖', '𐀗', '𐀘', '𐀙', '𐀚', '𐀛', '𐀜', '𐀝', '𐀞',
];

const HIEROGLYPHS = Object.fromEntries(CROATIAN_GRAPHEMES.map((grapheme, index) => [grapheme, HIEROGLYPH_SYMBOLS[index]]));
const LINEAR_B = Object.fromEntries(CROATIAN_GRAPHEMES.map((grapheme, index) => [grapheme, LINEAR_B_SYMBOLS[index]]));
const LATIN = Object.fromEntries(CROATIAN_GRAPHEMES.map((grapheme) => [grapheme, grapheme]));

const MAPS = Object.freeze({
  latin: Object.freeze(LATIN),
  glagolitic: Object.freeze(GLAGOLITIC_MAP),
  cyrillic: Object.freeze(CYRILLIC),
  arebica: Object.freeze(AREBICA),
  hebrew: Object.freeze(HEBREW),
  georgian: Object.freeze(GEORGIAN),
  hieroglyphs: Object.freeze(HIEROGLYPHS),
  'linear-b': Object.freeze(LINEAR_B),
});

const DIRECTIONS = Object.freeze({ arebica: 'rtl', hebrew: 'rtl' });

function makeReverseMap(mapping) {
  const reverse = new Map();
  const encodings = Object.entries(mapping)
    .map(([grapheme, encoded]) => ({ grapheme, encoded, length: [...encoded].length }))
    .sort((left, right) => right.length - left.length);
  for (const { grapheme, encoded } of encodings) {
    if (!reverse.has(encoded)) reverse.set(encoded, grapheme);
  }
  return reverse;
}

const REVERSE_MAPS = Object.freeze(Object.fromEntries(
  Object.entries(MAPS).map(([id, mapping]) => [id, makeReverseMap(mapping)]),
));

const ALPHABET_ENTRIES = Object.freeze(Object.fromEntries(
  Object.entries(MAPS).map(([id, mapping]) => [
    id,
    Object.freeze(CROATIAN_GRAPHEMES.map((source) => Object.freeze({ source, target: mapping[source] }))),
  ]),
));

function hasUpperCase(character) {
  return character !== character.toLocaleLowerCase('hr');
}

function preserveCyrillicCase(grapheme, points, index) {
  const first = points[index];
  if (!hasUpperCase(first)) return grapheme;
  let end = index;
  let allUpper = true;
  while (end < points.length && /\p{L}/u.test(points[end])) {
    if (!hasUpperCase(points[end])) allUpper = false;
    end += 1;
  }
  if (allUpper) return grapheme.toLocaleUpperCase('hr');
  return grapheme[0].toLocaleUpperCase('hr') + grapheme.slice(1);
}

function findLatinGrapheme(points, index) {
  for (const grapheme of CROATIAN_GRAPHEMES) {
    const size = [...grapheme].length;
    const candidate = points.slice(index, index + size).join('').toLocaleLowerCase('hr');
    if (candidate === grapheme) return grapheme;
  }
  return null;
}

function latinToAlphabet(text, alphabet) {
  if (alphabet === 'latin') return text;
  const mapping = MAPS[alphabet];
  if (!mapping) return text;
  const points = [...text];
  let output = '';
  for (let index = 0; index < points.length;) {
    const grapheme = findLatinGrapheme(points, index);
    if (!grapheme) {
      output += points[index];
      index += 1;
      continue;
    }
    const size = [...grapheme].length;
    const encoded = mapping[grapheme];
    output += alphabet === 'cyrillic' && hasUpperCase(points[index]) ? encoded.toLocaleUpperCase('hr') : encoded;
    index += size;
  }
  return output;
}

function alphabetToLatin(text, alphabet) {
  if (alphabet === 'latin') return text;
  const reverse = REVERSE_MAPS[alphabet];
  if (!reverse) return text;
  const points = [...text];
  let output = '';
  for (let index = 0; index < points.length;) {
    let match = null;
    let encodedLength = 0;
    for (const [encoded, grapheme] of reverse) {
      const length = [...encoded].length;
      const candidate = points.slice(index, index + length).join('');
      const comparable = alphabet === 'cyrillic' ? candidate.toLocaleLowerCase('hr') : candidate;
      if (comparable === encoded) {
        match = grapheme;
        encodedLength = length;
        break;
      }
    }
    if (!match) {
      output += points[index];
      index += 1;
      continue;
    }
    output += alphabet === 'cyrillic' ? preserveCyrillicCase(match, points, index) : match;
    index += encodedLength;
  }
  return output;
}

export function getAlphabetEntries(id) {
  return ALPHABET_ENTRIES[id] ?? [];
}

export function getAlphabetDirection(id) {
  return DIRECTIONS[id] ?? 'ltr';
}

export function transliterate(text, from, to) {
  if (from === to || !text) return text;
  const latin = alphabetToLatin(text, from);
  return latinToAlphabet(latin, to);
}

export function toLatin(text, from) {
  return alphabetToLatin(text, from);
}

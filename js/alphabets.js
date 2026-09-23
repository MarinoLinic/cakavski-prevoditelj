export const ALPHABETS = ['latin', 'glagolitic', 'cyrillic'];

const CYRILLIC_DIGRAPHS = [
  ['dž', 'џ'],
  ['lj', 'љ'],
  ['nj', 'њ'],
];

const CYRILLIC_SINGLE = {
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

const ALPHABET_ENTRIES = Object.freeze({
  latin: Object.freeze([
    ...CYRILLIC_DIGRAPHS.map(([source]) => Object.freeze({ source, target: source })),
    ...Object.keys(CYRILLIC_SINGLE).map((source) => Object.freeze({ source, target: source })),
  ]),
  cyrillic: Object.freeze([
    ...CYRILLIC_DIGRAPHS.map(([source, target]) => Object.freeze({ source, target })),
    ...Object.entries(CYRILLIC_SINGLE).map(([source, target]) => Object.freeze({ source, target })),
  ]),
  glagolitic: Object.freeze([
    ...CYRILLIC_DIGRAPHS.map(([source]) => Object.freeze({ source, target: [...source].map((char) => GLAGOLITIC[char]).join('') })),
    ...Object.entries(GLAGOLITIC).map(([source, target]) => Object.freeze({ source, target })),
  ]),
});

export function getAlphabetEntries(id) {
  return ALPHABET_ENTRIES[id] ?? [];
}

const CYRILLIC_REVERSE = (() => {
  const map = new Map();
  for (const [latin, cyrillic] of CYRILLIC_DIGRAPHS) map.set(cyrillic, latin);
  for (const [latin, cyrillic] of Object.entries(CYRILLIC_SINGLE)) {
    if (!map.has(cyrillic)) map.set(cyrillic, latin);
  }
  return map;
})();

const GLAGOLITIC_REVERSE = (() => {
  const map = new Map();
  for (const [latin, glagolitic] of Object.entries(GLAGOLITIC)) {
    if (!map.has(glagolitic)) map.set(glagolitic, latin);
  }
  return map;
})();

function isUpper(char) {
  return char.toLowerCase() !== char;
}

function latinToCyrillic(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const pair = text.slice(i, i + 2);
    const digraph = CYRILLIC_DIGRAPHS.find(([latin]) => latin === pair.toLowerCase());
    if (digraph) {
      const mapped = digraph[1];
      out += isUpper(pair[0]) ? mapped.toUpperCase() : mapped;
      i += 2;
      continue;
    }
    const char = text[i];
    const mapped = CYRILLIC_SINGLE[char.toLowerCase()];
    if (mapped) {
      out += isUpper(char) ? mapped.toUpperCase() : mapped;
    } else {
      out += char;
    }
    i += 1;
  }
  return out;
}

function expandCase(mapped, char, text, index) {
  if (!isUpper(char)) return mapped;
  let j = index + 1;
  let allUpper = true;
  while (j < text.length && /[\p{L}]/u.test(text[j])) {
    if (text[j].toLowerCase() === text[j]) {
      allUpper = false;
      break;
    }
    j += 1;
  }
  if (allUpper) return mapped.toUpperCase();
  return mapped[0].toUpperCase() + mapped.slice(1);
}

function cyrillicToLatin(text) {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const mapped = CYRILLIC_REVERSE.get(char.toLowerCase());
    if (!mapped) {
      out += char;
    } else {
      out += expandCase(mapped, char, text, i);
    }
  }
  return out;
}

function latinToGlagolitic(text) {
  let out = '';
  for (const char of text) {
    out += GLAGOLITIC[char.toLowerCase()] ?? char;
  }
  return out;
}

function glagoliticToLatin(text) {
  let out = '';
  for (const char of text) {
    out += GLAGOLITIC_REVERSE.get(char) ?? char;
  }
  return out;
}

export function transliterate(text, from, to) {
  if (from === to || !text) return text;
  if (from === 'latin' && to === 'cyrillic') return latinToCyrillic(text);
  if (from === 'cyrillic' && to === 'latin') return cyrillicToLatin(text);
  if (from === 'latin' && to === 'glagolitic') return latinToGlagolitic(text);
  if (from === 'glagolitic' && to === 'latin') return glagoliticToLatin(text);
  if (to === 'latin') return transliterate(text, from, 'latin');
  return transliterate(transliterate(text, from, 'latin'), 'latin', to);
}

export function toLatin(text, from) {
  return transliterate(text, from, 'latin');
}

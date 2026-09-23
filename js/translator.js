const TOKEN_RE = /\p{L}+(?:'\p{L}+)*/u;

const LOCATIVE_PREPOSITIONS = new Set(['na', 'u', 'o', 'po', 'pri']);
const ACCUSATIVE_PREPOSITIONS = new Set(['na', 'u', 'za', 'kroz']);

const NON_NOUN_LEMMAS = new Set([
  'a', 'ako', 'ali', 'bi', 'bih', 'bismo', 'biste', 'da', 'do', 'dok', 'ga', 'gdje',
  'i', 'ili', 'iz', 'ja', 'je', 'jer', 'kad', 'kada', 'kako', 'kao', 'koji', 'koja',
  'koje', 'kroz', 'li', 'me', 'mi', 'mu', 'na', 'ne', 'nego', 'ni', 'nije', 'njega',
  'njemu', 'o', 'od', 'on', 'ona', 'ono', 'pa', 'po', 'pod', 'prema', 'pri', 'sa',
  'sam', 'se', 'si', 'smo', 'ste', 'su', 'ta', 'taj', 'te', 'ti', 'to', 'tko', 'u',
  'uz', 'već', 'za', 'što',
]);

const NOUN_SLOTS = [
  'nom_sg', 'acc_sg', 'gen_sg', 'datloc_sg', 'inst_sg', 'voc_sg',
  'nom_pl', 'acc_pl', 'gen_pl', 'dli_pl',
];

const NOUN_PARADIGMS = {
  aClass: {
    nom_sg: ['a'], acc_sg: ['u'], gen_sg: ['e'], datloc_sg: ['i'],
    inst_sg: ['om'], voc_sg: ['o'],
    nom_pl: ['e'], acc_pl: ['e'], gen_pl: ['a'], dli_pl: ['ama'],
  },
  consonant: {
    nom_sg: [''], acc_sg: [''], gen_sg: ['a'], datloc_sg: ['u'],
    inst_sg: ['om'], voc_sg: ['e'],
    nom_pl: ['i', 'ovi'], acc_pl: ['e', 'ove'], gen_pl: ['a', 'ova'], dli_pl: ['ima'],
  },
  neuter: {
    nom_sg: [''], acc_sg: [''], voc_sg: [''], gen_sg: ['a'],
    datloc_sg: ['u'], inst_sg: ['om'],
    nom_pl: ['a'], acc_pl: ['a'], gen_pl: ['a'], dli_pl: ['ima'],
  },
};

const VERB_SLOTS = [
  'inf', 'pres_1', 'pres_2', 'pres_3', 'pres_1pl', 'pres_2pl', 'pres_3pl',
  'past_m', 'past_f', 'past_n', 'past_mpl', 'past_fpl', 'imp', 'imp_pl',
];

const VERB_PARADIGMS = {
  ati: {
    sourceEnding: 'ati', targetEndings: ['at', 'ati'],
    source: {
      inf: ['ati'], pres_1: ['am'], pres_2: ['aš'], pres_3: ['a'],
      pres_1pl: ['amo'], pres_2pl: ['ate'], pres_3pl: ['aju'],
      past_m: ['ao'], past_f: ['ala'], past_n: ['alo'], past_mpl: ['ali'], past_fpl: ['ale'],
      imp: ['aj'], imp_pl: ['ajte'],
    },
    target: {
      inf: (ending) => [ending], pres_1: () => ['am'], pres_2: () => ['aš'], pres_3: () => ['a'],
      pres_1pl: () => ['amo'], pres_2pl: () => ['ate'], pres_3pl: () => ['aju'],
      past_m: () => ['al'], past_f: () => ['ala'], past_n: () => ['alo'], past_mpl: () => ['ali'], past_fpl: () => ['ale'],
      imp: () => ['aj'], imp_pl: () => ['ajte'],
    },
  },
  iti: {
    sourceEnding: 'iti', targetEndings: ['it', 'iti'],
    source: {
      inf: ['iti'], pres_1: ['im'], pres_2: ['iš'], pres_3: ['i'],
      pres_1pl: ['imo'], pres_2pl: ['ite'], pres_3pl: ['e'],
      past_m: ['io'], past_f: ['ila'], past_n: ['ilo'], past_mpl: ['ili'], past_fpl: ['ile'],
      imp: ['i'], imp_pl: ['ite'],
    },
    target: {
      inf: (ending) => [ending], pres_1: () => ['in'], pres_2: () => ['iš'], pres_3: () => ['i'],
      pres_1pl: () => ['imo'], pres_2pl: () => ['ite'], pres_3pl: () => ['e'],
      past_m: () => ['il'], past_f: () => ['ila'], past_n: () => ['ilo'], past_mpl: () => ['ili'], past_fpl: () => ['ile'],
      imp: () => ['i'], imp_pl: () => ['ite'],
    },
  },
  jeti: {
    sourceEnding: 'jeti', targetEndings: ['et', 'jeti'],
    source: {
      inf: ['jeti'], pres_1: ['im'], pres_2: ['iš'], pres_3: ['i'],
      pres_1pl: ['imo'], pres_2pl: ['ite'], pres_3pl: ['e'],
      past_m: ['io'], past_f: ['jela'], past_n: ['jelo'], past_mpl: ['jeli'], past_fpl: ['jele'],
      imp: ['i'], imp_pl: ['ite'],
    },
    target: {
      inf: (ending) => [ending], pres_1: () => ['in'], pres_2: () => ['iš'], pres_3: () => ['i'],
      pres_1pl: () => ['imo'], pres_2pl: () => ['ite'], pres_3pl: () => ['e'],
      past_m: () => ['el'], past_f: () => ['ela'], past_n: () => ['elo'], past_mpl: () => ['eli'], past_fpl: () => ['ele'],
      imp: () => ['i'], imp_pl: () => ['ite'],
    },
  },
};

function normalizeForm(form) {
  return form.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isSingleWord(form) {
  return !form.includes(' ');
}

function classifyNoun(word) {
  if (word.endsWith('a')) return 'aClass';
  if (word.endsWith('o') || word.endsWith('e')) return 'neuter';
  return 'consonant';
}

function nounStem(word) {
  return /[aoe]$/.test(word) ? word.slice(0, -1) : word;
}

function canGenerateNoun(source, target) {
  if (source.length < 3 || target.length < 3) return false;
  if (nounStem(source).length < 3 || nounStem(target).length < 3) return false;
  if (NON_NOUN_LEMMAS.has(source) || NON_NOUN_LEMMAS.has(target)) return false;
  if (classifyNoun(source) === 'consonant' && target.endsWith('i')) return false;
  return true;
}

function classifyVerbSource(word) {
  if (word.endsWith('jeti')) return 'jeti';
  if (word.endsWith('ati')) return 'ati';
  if (word.endsWith('iti')) return 'iti';
  if (word.endsWith('ći')) return 'ci';
  return null;
}

function classifyVerbTarget(word, family) {
  if (family === 'ci') return word.endsWith('ć') && word.length > 1 ? 'ć' : null;
  for (const ending of VERB_PARADIGMS[family].targetEndings) {
    if (word.endsWith(ending) && word.length > ending.length) return ending;
  }
  return null;
}

function nounSurfaces(word) {
  const paradigm = NOUN_PARADIGMS[classifyNoun(word)];
  const stem = nounStem(word);
  const out = [];
  for (const slot of NOUN_SLOTS) {
    for (const suffix of paradigm[slot] ?? []) out.push({ slot, surface: stem + suffix });
  }
  return out;
}

function verbSurfaces(word, family, side, ending) {
  const paradigm = VERB_PARADIGMS[family];
  const stemLength = side === 'source' ? paradigm.sourceEnding.length : ending.length;
  const stem = word.slice(0, word.length - stemLength);
  const slots = side === 'source' ? paradigm.source : paradigm.target;
  const out = [];
  for (const slot of VERB_SLOTS) {
    const spec = slots[slot];
    if (!spec) continue;
    const suffixes = typeof spec === 'function' ? spec(ending) : spec;
    for (const suffix of suffixes) out.push({ slot, surface: stem + suffix });
  }
  return out;
}

function pickCandidate(candidates, previousToken) {
  if (!previousToken) return null;
  const prev = previousToken.toLowerCase();
  const isLoc = (slot) => slot === 'datloc_sg' || slot === 'dli_pl';
  const isAcc = (slot) => slot === 'acc_sg' || slot === 'acc_pl';
  if (LOCATIVE_PREPOSITIONS.has(prev)) {
    const loc = candidates.find((candidate) => isLoc(candidate.slot));
    if (loc) return loc;
  }
  if (ACCUSATIVE_PREPOSITIONS.has(prev)) {
    const acc = candidates.find((candidate) => isAcc(candidate.slot));
    if (acc) return acc;
  }
  return null;
}

export function preserveCase(source, target) {
  const letters = [...source].filter((char) => /\p{L}/u.test(char));
  if (!letters.length) return target;
  const allUpper = letters.every((char) => char.toUpperCase() === char && char.toLowerCase() !== char);
  if (allUpper) return target.toUpperCase();
  const [first, ...rest] = letters;
  const initialCap = first.toUpperCase() === first && rest.every((char) => char.toLowerCase() === char);
  return initialCap ? target.replace(/\p{L}/u, (char) => char.toUpperCase()) : target;
}

function isInitialCapital(token) {
  const letters = [...token].filter((char) => /\p{L}/u.test(char));
  if (!letters.length) return false;
  const [first, ...rest] = letters;
  return first.toUpperCase() === first
    && first.toLowerCase() !== first
    && rest.every((char) => char.toLowerCase() === char);
}

function isSentenceInitial(beforeText) {
  for (let i = beforeText.length - 1; i >= 0; i -= 1) {
    const char = beforeText[i];
    if (/\s/u.test(char) || '"\'„“”‘’«»()[]{}'.includes(char)) continue;
    return '.!?…'.includes(char);
  }
  return true;
}

function applyCakavianFallback(token, sentenceInitial) {
  if (isInitialCapital(token) && !sentenceInitial) return token;
  const lower = token.toLowerCase();
  let next = lower;
  if (next.endsWith('io')) next = next.slice(0, -2) + 'il';
  else if (next.endsWith('m')) next = next.slice(0, -1) + 'n';
  const ije = next.indexOf('ije');
  if (ije !== -1) next = next.slice(0, ije) + 'e' + next.slice(ije + 3);
  return next === lower ? token : preserveCase(token, next);
}

function applyDalmatianFallback(token) {
  const lower = token.toLowerCase();
  let next = lower;
  const ije = next.indexOf('ije');
  if (ije !== -1) next = next.slice(0, ije) + 'i' + next.slice(ije + 3);
  if (next.endsWith('io')) next = next.slice(0, -2) + 'ija';
  else if (next.endsWith('ao')) next = next.slice(0, -2) + 'a';
  else if (next.endsWith('am')) next = next.slice(0, -2) + 'an';
  else if (next.length >= 5 && next.endsWith('ti')) next = next.slice(0, -2) + 't';
  return next === lower ? token : preserveCase(token, next);
}

function tokenize(text) {
  const parts = [];
  let last = 0;
  for (const match of text.matchAll(new RegExp(TOKEN_RE, 'gu'))) {
    if (match.index > last) parts.push({ type: 'sep', text: text.slice(last, match.index) });
    parts.push({ type: 'word', text: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: 'sep', text: text.slice(last) });
  return parts;
}

function identityInspect(text) {
  const segments = tokenize(text).map((part) => ({ text: part.text, changed: false }));
  return { text, changed: 0, matched: 0, segments };
}

function isStandaloneParticleUtterance(parts) {
  if (parts.filter((part) => part.type === 'word').length !== 1) return false;
  return parts.every((part) => part.type === 'word' || /^[\s\p{P}]*$/u.test(part.text));
}

function addAlternative(options, key, target) {
  if (!options.has(key)) options.set(key, []);
  const alternatives = options.get(key);
  if (!alternatives.some((value) => normalizeForm(value) === normalizeForm(target))) alternatives.push(target);
}

function chooseAlternative(alternatives, random) {
  const choice = Math.floor(random() * alternatives.length);
  const index = Number.isFinite(choice) ? Math.max(0, Math.min(alternatives.length - 1, choice)) : 0;
  return alternatives[index];
}

function finalizeOptions(options, random) {
  return new Map([...options].map(([key, alternatives]) => [key, chooseAlternative(alternatives, random)]));
}

function buildIndexes(entries, sourceKey, targetKey, random) {
  const exactOptions = new Map();
  const phraseOptions = new Map();
  let maxPhraseWords = 1;
  for (const entry of entries) {
    const source = entry[sourceKey];
    const target = entry[targetKey];
    if (!source || !target) continue;
    const key = normalizeForm(source);
    if (!key) continue;
    if (isSingleWord(key)) {
      addAlternative(exactOptions, key, target);
    } else {
      addAlternative(phraseOptions, key, target);
      maxPhraseWords = Math.max(maxPhraseWords, key.split(' ').length);
    }
  }
  return {
    exact: finalizeOptions(exactOptions, random),
    phrases: finalizeOptions(phraseOptions, random),
    maxPhraseWords,
  };
}

function addGenerated(table, direction, surface, candidate) {
  const list = table[direction].get(surface);
  if (list) {
    if (!list.some((item) => item.slot === candidate.slot && item.target === candidate.target)) list.push(candidate);
  } else {
    table[direction].set(surface, [candidate]);
  }
}

function buildCakavianIndexes(dictionary, random) {
  const allEntries = Array.isArray(dictionary) ? dictionary : [];
  const entries = allEntries.filter((entry) => entry.type !== 'particle');
  const particles = allEntries.filter((entry) => entry.type === 'particle');
  const standardToCak = buildIndexes(entries, 'standard', 'dialect', random);
  const cakToStandard = buildIndexes(entries, 'dialect', 'standard', random);
  const exact = { standard: standardToCak.exact, cakavian: cakToStandard.exact };
  const phrases = { standard: standardToCak.phrases, cakavian: cakToStandard.phrases };
  const maxPhraseWords = {
    standard: standardToCak.maxPhraseWords,
    cakavian: cakToStandard.maxPhraseWords,
  };
  const generatedVerb = { standard: new Map(), cakavian: new Map() };
  const generatedNoun = { standard: new Map(), cakavian: new Map() };
  const standardHeadwords = new Set(entries.map((entry) => normalizeForm(entry.standard ?? '')).filter(Boolean));
  const dialectTargetCounts = new Map();
  for (const entry of entries) {
    if (!entry.standard || !entry.dialect) continue;
    const key = normalizeForm(entry.dialect);
    dialectTargetCounts.set(key, (dialectTargetCounts.get(key) ?? 0) + 1);
  }
  const adjectivePairs = new Set();
  const adjectiveStems = new Set();
  for (const entry of entries) {
    const sourceKey = normalizeForm(entry.standard ?? '');
    const targetKey = normalizeForm(entry.dialect ?? '');
    if (!sourceKey || !targetKey || !isSingleWord(sourceKey) || !isSingleWord(targetKey)) continue;
    if (classifyNoun(sourceKey) === 'consonant' && targetKey.endsWith('i')) {
      adjectivePairs.add(`${sourceKey}\u0000${targetKey}`);
    }
    if (sourceKey.endsWith('i') && targetKey.endsWith('i')) {
      adjectiveStems.add(sourceKey.slice(0, -1));
    }
  }

  for (const entry of entries) {
    const stdForm = entry.standard;
    const cakForm = entry.dialect;
    if (!stdForm || !cakForm) continue;
    if (entry.note && entry.note !== 'Kurirana gramatička dopuna.') continue;
    if (!isSingleWord(stdForm) || !isSingleWord(cakForm)) continue;
    const stdKey = normalizeForm(stdForm);
    const cakKey = normalizeForm(cakForm);
    if (!stdKey || !cakKey) continue;
    if (dialectTargetCounts.get(cakKey) > 1 && entry.note !== 'Kurirana gramatička dopuna.') continue;
    const stdVerb = classifyVerbSource(stdKey);
    const cakVerbEnding = stdVerb ? classifyVerbTarget(cakKey, stdVerb) : null;

    if (stdVerb) {
      if (stdVerb !== 'ci' && cakVerbEnding) {
        const srcSurfaces = verbSurfaces(stdKey, stdVerb, 'source');
        const tgtSurfaces = verbSurfaces(cakKey, stdVerb, 'target', cakVerbEnding);
        const tgtBySlot = new Map();
        for (const item of tgtSurfaces) {
          if (!tgtBySlot.has(item.slot)) tgtBySlot.set(item.slot, []);
          tgtBySlot.get(item.slot).push(item.surface);
        }
        for (const item of srcSurfaces) {
          for (const target of tgtBySlot.get(item.slot) ?? []) {
            addGenerated(generatedVerb, 'standard', item.surface, { slot: item.slot, target });
          }
        }
        const srcBySlot = new Map();
        for (const item of srcSurfaces) {
          if (!srcBySlot.has(item.slot)) srcBySlot.set(item.slot, []);
          srcBySlot.get(item.slot).push(item.surface);
        }
        for (const item of tgtSurfaces) {
          for (const target of srcBySlot.get(item.slot) ?? []) {
            addGenerated(generatedVerb, 'cakavian', item.surface, { slot: item.slot, target });
          }
        }
      }
      continue;
    }
    const neuterAdjectivePair = stdKey.endsWith('o') && cakKey.endsWith('o')
      && adjectivePairs.has(`${stdKey.slice(0, -1)}\u0000${cakKey.slice(0, -1)}i`);
    const neuterAdjectiveStem = /[oe]$/.test(stdKey) && adjectiveStems.has(stdKey.slice(0, -1));
    const ambiguousTarget = stdKey !== cakKey && standardHeadwords.has(cakKey);
    if (neuterAdjectivePair || neuterAdjectiveStem || ambiguousTarget || !canGenerateNoun(stdKey, cakKey)) continue;

    const stdNoun = nounSurfaces(stdKey);
    const cakNoun = nounSurfaces(cakKey);
    const cakBySlot = new Map();
    for (const item of cakNoun) {
      if (!cakBySlot.has(item.slot)) cakBySlot.set(item.slot, []);
      cakBySlot.get(item.slot).push(item.surface);
    }
    for (const item of stdNoun) {
      for (const target of cakBySlot.get(item.slot) ?? []) {
        addGenerated(generatedNoun, 'standard', item.surface, { slot: item.slot, target });
      }
    }
    const stdBySlot = new Map();
    for (const item of stdNoun) {
      if (!stdBySlot.has(item.slot)) stdBySlot.set(item.slot, []);
      stdBySlot.get(item.slot).push(item.surface);
    }
    for (const item of cakNoun) {
      for (const target of stdBySlot.get(item.slot) ?? []) {
        addGenerated(generatedNoun, 'cakavian', item.surface, { slot: item.slot, target });
      }
    }
  }

  return {
    exact,
    phrases,
    maxPhraseWords,
    generatedVerb,
    generatedNoun,
    entries,
    particles: {
      standard: buildIndexes(particles, 'standard', 'dialect', random).exact,
      cakavian: buildIndexes(particles, 'dialect', 'standard', random).exact,
    },
  };
}

function findPhrase(parts, start, maxWords, phraseMap) {
  const words = [start];
  const separators = [];
  let cursor = start;
  while (words.length < maxWords) {
    const separatorIndex = cursor + 1;
    const wordIndex = cursor + 2;
    const separator = parts[separatorIndex];
    const word = parts[wordIndex];
    if (!separator || separator.type !== 'sep' || !/^\s+$/u.test(separator.text) || !word || word.type !== 'word') break;
    separators.push(separatorIndex);
    words.push(wordIndex);
    cursor = wordIndex;
  }
  for (let length = words.length; length >= 2; length -= 1) {
    const indexes = words.slice(0, length);
    const key = indexes.map((index) => normalizeForm(parts[index].text)).join(' ');
    if (phraseMap.has(key)) return { indexes, separatorIndexes: separators.slice(0, length - 1), target: phraseMap.get(key) };
  }
  return null;
}

function appendSegment(segments, text, changed) {
  if (!text) return;
  const previous = segments.at(-1);
  if (previous && previous.changed === changed && previous.type === (changed ? 'word' : 'sep')) {
    previous.text += text;
  } else {
    segments.push({ text, changed, type: changed ? 'word' : 'sep' });
  }
}

function directCakavianInspect(text, from, indexes) {
  if (from === 'standard' && indexes === null) return identityInspect(text);
  const direction = from === 'standard' ? 'standard' : 'cakavian';
  const parts = tokenize(text);
  const standaloneParticle = isStandaloneParticleUtterance(parts);
  const segments = [];
  let changed = 0;
  let matched = 0;
  let previousWord = null;
  let accumulated = '';
  let i = 0;

  while (i < parts.length) {
    const part = parts[i];
    if (part.type === 'sep') {
      appendSegment(segments, part.text, false);
      accumulated += part.text;
      i += 1;
      continue;
    }

    const phrase = findPhrase(parts, i, indexes.maxPhraseWords[direction], indexes.phrases[direction]);
    if (phrase) {
      const originalWords = phrase.indexes.map((index) => parts[index].text);
      const targetWords = preserveCase(originalWords[0], phrase.target).split(/\s+/u);
      const assigned = Array.from({ length: originalWords.length }, () => []);
      targetWords.forEach((target, targetIndex) => {
        const slot = Math.min(originalWords.length - 1, Math.floor(targetIndex * originalWords.length / targetWords.length));
        assigned[slot].push(target);
      });
      for (let slot = 0; slot < originalWords.length; slot += 1) {
        const targetText = assigned[slot].join(' ');
        const isChanged = targetText !== originalWords[slot];
        if (targetText) appendSegment(segments, targetText, isChanged);
        if (isChanged || !targetText) changed += 1;
        matched += 1;
        accumulated += targetText;
        if (slot < phrase.separatorIndexes.length) {
          const separator = parts[phrase.separatorIndexes[slot]].text;
          appendSegment(segments, separator, false);
          accumulated += separator;
        }
      }
      previousWord = originalWords.at(-1);
      i = phrase.indexes.at(-1) + 1;
      continue;
    }

    const key = normalizeForm(part.text);
    const particleTarget = standaloneParticle ? indexes.particles[direction].get(key) : undefined;
    const verbCandidates = indexes.generatedVerb[direction].get(key) ?? [];
    const nounCandidates = indexes.generatedNoun[direction].get(key) ?? [];
    const exactTarget = indexes.exact[direction].get(key);
    const contextual = pickCandidate([...verbCandidates, ...nounCandidates], previousWord);
    let result = null;
    if (particleTarget !== undefined) {
      result = preserveCase(part.text, particleTarget);
      matched += 1;
    } else if (contextual) {
      result = preserveCase(part.text, contextual.target);
      matched += 1;
    } else if (verbCandidates.length) {
      result = preserveCase(part.text, verbCandidates[0].target);
      matched += 1;
    } else if (exactTarget !== undefined) {
      result = preserveCase(part.text, exactTarget);
      matched += 1;
    } else if (nounCandidates.length) {
      result = preserveCase(part.text, nounCandidates[0].target);
      matched += 1;
    }
    if (result === null && from === 'standard') {
      const fallback = applyCakavianFallback(part.text, isSentenceInitial(accumulated));
      if (fallback !== part.text) result = fallback;
    }
    if (result === null) result = part.text;
    const isChanged = result !== part.text;
    appendSegment(segments, result, isChanged);
    if (isChanged) changed += 1;
    accumulated += result;
    previousWord = part.text;
    i += 1;
  }

  const cleanSegments = segments.map(({ text: segmentText, changed: segmentChanged }) => ({ text: segmentText, changed: segmentChanged }));
  return { text: cleanSegments.map((segment) => segment.text).join(''), changed, matched, segments: cleanSegments };
}

function directDalmatianInspect(text, from, indexes) {
  const direction = from === 'standard' ? 'standard' : 'dalmatian';
  const map = indexes[direction];
  const parts = tokenize(text);
  const segments = [];
  let changed = 0;
  let matched = 0;
  for (const part of parts) {
    if (part.type === 'sep') {
      appendSegment(segments, part.text, false);
      continue;
    }
    const key = normalizeForm(part.text);
    const exactTarget = map.get(key);
    let result = exactTarget === undefined ? null : preserveCase(part.text, exactTarget);
    if (result !== null) matched += 1;
    if (result === null && from === 'standard') result = applyDalmatianFallback(part.text);
    if (result === null) result = part.text;
    const isChanged = result !== part.text;
    if (isChanged) changed += 1;
    appendSegment(segments, result, isChanged);
  }
  const cleanSegments = segments.map(({ text: segmentText, changed: segmentChanged }) => ({ text: segmentText, changed: segmentChanged }));
  return { text: cleanSegments.map((segment) => segment.text).join(''), changed, matched, segments: cleanSegments };
}

function buildDalmatianMaps(dictionary, random) {
  const entries = Array.isArray(dictionary) ? dictionary : [];
  const forward = buildIndexes(entries, 'standard', 'dialect', random).exact;
  const reverse = buildIndexes(entries, 'dialect', 'standard', random).exact;
  return { standard: forward, dalmatian: reverse };
}

function compareSegments(source, target) {
  const sourceWords = tokenize(source).filter((part) => part.type === 'word').map((part) => part.text);
  const targetParts = tokenize(target);
  const segments = [];
  let targetWord = 0;
  let changed = 0;
  for (const part of targetParts) {
    if (part.type === 'sep') {
      appendSegment(segments, part.text, false);
      continue;
    }
    const sourceWord = sourceWords[targetWord];
    const isChanged = sourceWord === undefined || sourceWord !== part.text;
    if (isChanged) changed += 1;
    appendSegment(segments, part.text, isChanged);
    targetWord += 1;
  }
  changed += Math.max(0, sourceWords.length - targetWord);
  const cleanSegments = segments.map(({ text, changed: isChanged }) => ({ text, changed: isChanged }));
  return { text: target, changed, segments: cleanSegments };
}

function buildProfileLexicon(entries) {
  return entries.flatMap((entry) => {
    const source = entry.standard || entry.note;
    const target = entry.dialect;
    if (!source && !target) return [];
    return [{ source, target }];
  }).sort((a, b) => a.source.localeCompare(b.source, 'hr'));
}

function buildStandardLexicon(entries, profile) {
  return entries.filter((entry) => entry.standard).map((entry) => ({
    source: entry.standard,
    target: entry.dialect,
    profile,
  }));
}

export function createTranslator({ cakavian, dalmatian, random = Math.random }) {
  const cakIndexes = buildCakavianIndexes(cakavian, random);
  const dalIndexes = buildDalmatianMaps(dalmatian, random);
  const cakLexicon = buildProfileLexicon(cakavian);
  const dalLexicon = buildProfileLexicon(dalmatian);
  const standardLexicon = [
    ...buildStandardLexicon(cakavian, 'Čakavski'),
    ...buildStandardLexicon(dalmatian, 'Dalmatinska ikavica'),
  ].sort((a, b) => a.source.localeCompare(b.source, 'hr'));

  function inspectDirect(text, from, to) {
    if (from === to) return identityInspect(text);
    if ((from === 'standard' && to === 'cakavian') || (from === 'cakavian' && to === 'standard')) {
      return directCakavianInspect(text, from, cakIndexes);
    }
    if ((from === 'standard' && to === 'dalmatian') || (from === 'dalmatian' && to === 'standard')) {
      return directDalmatianInspect(text, from, dalIndexes);
    }
    return identityInspect(text);
  }

  function inspect(text, from, to) {
    if (from === to) return identityInspect(text);
    if (from === 'standard' || to === 'standard') return inspectDirect(text, from, to);
    const toStandard = inspectDirect(text, from, 'standard');
    const fromStandard = inspectDirect(toStandard.text, 'standard', to);
    const compared = compareSegments(text, fromStandard.text);
    return {
      text: fromStandard.text,
      changed: compared.changed,
      matched: toStandard.matched + fromStandard.matched,
      segments: compared.segments,
    };
  }

  function translate(text, from, to) {
    return inspect(text, from, to).text;
  }

  function getLexicon(language) {
    if (language === 'cakavian') return cakLexicon.map(({ source, target }) => ({ source, target }));
    if (language === 'dalmatian') return dalLexicon.map(({ source, target }) => ({ source, target }));
    if (language === 'standard') return standardLexicon.map((entry) => ({ ...entry }));
    return [];
  }

  return { translate, inspect, getLexicon };
}

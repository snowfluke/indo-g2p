// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/** Indonesian vowel letters. */
export const VOWELS: ReadonlySet<string> = new Set(["a", "i", "u", "e", "o"]);

/** Spoken name of each letter of the alphabet, used to expand abbreviations. */
/** Spoken name of each letter of the alphabet, used to expand abbreviations. */
export const LETTER_NAMES: ReadonlyMap<string, string> = new Map([
  ["a", "a"],
  ["b", "bé"],
  ["c", "cé"],
  ["d", "dé"],
  ["e", "é"],
  ["f", "èf"],
  ["g", "gé"],
  ["h", "ha"],
  ["i", "i"],
  ["j", "jé"],
  ["k", "ka"],
  ["l", "èl"],
  ["m", "èm"],
  ["n", "èn"],
  ["o", "o"],
  ["p", "pé"],
  ["q", "ki"],
  ["r", "èr"],
  ["s", "ès"],
  ["t", "té"],
  ["u", "u"],
  ["v", "vé"],
  ["w", "wé"],
  ["x", "èks"],
  ["y", "yé"],
  ["z", "zèt"],
]);

/**
 * Consonant/vowel shapes a real Indonesian word can be built from.
 * A word whose shape contains none of these is treated as an abbreviation.
 */
export const SYLLABLE_PATTERNS: readonly string[] = [
  "VK",
  "KV",
  "KVK",
  "VKK",
  "KKV",
  "KKVK",
  "KVKK",
  "KKKV",
  "KKKVK",
  "KKVKK",
  "KVKKK",
];

/**
 * A `k` between a vowel and a consonant is a glottal stop, as in `pa/ʔ/sa`.
 *
 * Three consonants are left out of the following set, where upstream includes
 * them all:
 *
 * - `h`, because `kh` is a digraph rather than a `k` before a consonant.
 *   Upstream turns `akhir` into `aʔhir`, so the later `kh` to `x` mapping
 *   never sees its input; the word is `axir`.
 * - `r` and `l`, because `kr` and `kl` are Latin onset clusters that native
 *   roots do not form across a syllable break. Every word that reaches them is
 *   a borrowing: `demokrat`, `sekretaris`, `iklan`, `nuklir`, `akrab`.
 */
export const GLOTTAL_STOP_PATTERN: RegExp = /[aiueəo]k[bcdfgjkmnpqstvwxyz]/g;

/**
 * The one place a `k` before `l` still is a glottal stop.
 *
 * `-lah` is a clitic, so its `k` ends a root rather than opening a cluster:
 * `tidak` + `lah` is `tidaʔlah`, not `tidaklah`.
 */
export const GLOTTAL_BEFORE_CLITIC_PATTERN: RegExp = /[aiueəo]k(?=lah$)/g;

/** Runs of Latin letters. Everything else passes through untouched. */
export const WORD_PATTERN: RegExp = /[a-z]+/g;

/**
 * `ny` is only the digraph `/ɲ/` when a vowel follows it.
 *
 * Indonesian words do not end in `ny`, so every word that reaches this rule
 * without a following vowel is a borrowed name. Upstream maps them anyway,
 * turning `denny` into `denɲ`, a syllable with no vowel at all.
 *
 * `sy` gets no such guard: `musyrik` is `/muʃrik/`, with the digraph before a
 * consonant, and `ng` is a real Indonesian ending as in `uang`.
 */
export const NASAL_DIGRAPH_PATTERN: RegExp = /ny(?=[aiueoəéè])/g;

/** Grapheme to phoneme substitutions, applied in order. */
export const PHONEME_REPLACEMENTS: readonly (readonly [string, string])[] = [
  // `ch` is read as plain /tʃ/. Mapping `c` first would leave `tʃh`, which
  // Indonesian cannot pronounce, in every borrowed name that has it.
  ["ch", "tʃ"],
  ["x", "ks"],
  ["c", "tʃ"],
  ["j", "dʒ"],
  ["ng", "ŋ"],
  ["sy", "ʃ"],
  ["kh", "x"],
  ["v", "f"],
  ["y", "j"],
];

/** Phoneme to grapheme substitutions, applied in order. Not an exact inverse. */
export const GRAPHEME_REPLACEMENTS: readonly (readonly [string, string])[] = [
  ["j", "y"],
  ["tʃ", "c"],
  ["dʒ", "j"],
  ["ŋ", "ng"],
  ["ɲ", "ny"],
  ["ʃ", "sy"],
  ["x", "kh"],
  ["ɪ", "i"],
  ["ʊ", "u"],
  ["ɔ", "o"],
  ["ʔ", "k"],
  ["ə", "e"],
];

/** Diphthongs, written as their IPA pair. */
export const DIPHTHONGS: readonly (readonly [string, string])[] = [
  ["ai", "aɪ"],
  ["au", "aʊ"],
  ["oi", "ɔɪ"],
];

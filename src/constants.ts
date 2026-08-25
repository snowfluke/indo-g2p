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

/** A `k` between a vowel and a consonant is a glottal stop, as in `pa/ʔ/sa`. */
export const GLOTTAL_STOP_PATTERN: RegExp = /[aiueəo]k[bcdfghjklmnpqrstvwxyz]/g;

/** Runs of Latin letters. Everything else passes through untouched. */
export const WORD_PATTERN: RegExp = /[a-z]+/g;

/** Grapheme to phoneme substitutions, applied in order. */
export const PHONEME_REPLACEMENTS: readonly (readonly [string, string])[] = [
  ["x", "ks"],
  ["c", "tʃ"],
  ["j", "dʒ"],
  ["ng", "ŋ"],
  ["ny", "ɲ"],
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

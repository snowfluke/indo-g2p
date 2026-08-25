// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import {
  DIPHTHONGS,
  GLOTTAL_STOP_PATTERN,
  GRAPHEME_REPLACEMENTS,
  LETTER_NAMES,
  PHONEME_REPLACEMENTS,
  SYLLABLE_PATTERNS,
  VOWELS,
  WORD_PATTERN,
} from "./constants.ts";
import { applySchwa } from "./schwa.ts";
import { toSyllables } from "./syllabifier.ts";
import type { G2PResult, ToPhonemeOptions } from "./types.ts";

/** Describe a word as its consonant/vowel shape, such as `KVKKVK` for `bangsat`. */
function syllableShape(word: string): string {
  return [...word].map((char) => (VOWELS.has(char) ? "V" : "K")).join("");
}

/** A word with no valid syllable shape is read letter by letter, so `tv` becomes `tévé`. */
function isAbbreviation(word: string): boolean {
  const shape = syllableShape(word);
  return !SYLLABLE_PATTERNS.some((pattern) => shape.includes(pattern));
}

function spellOut(word: string): string {
  return [...word].map((char) => LETTER_NAMES[char] ?? char).join("");
}

/** Mark every `k` that sits between a vowel and a consonant as a glottal stop. */
function applyGlottalStops(word: string): string {
  const chars = [...word];
  for (const match of word.matchAll(GLOTTAL_STOP_PATTERN)) {
    chars[match.index + 1] = "ʔ";
  }
  return chars.join("");
}

function applyReplacements(text: string, pairs: readonly (readonly [string, string])[]): string {
  let result = text;
  for (const [from, to] of pairs) result = result.replaceAll(from, to);
  return result;
}

/** Convert one already-lowercased word to its phonemes. */
function wordToPhonemes(
  word: string,
  expandAbbr: boolean,
  resolved: string | undefined
): { phonemes: string; abbr: boolean } {
  const abbr = expandAbbr && isAbbreviation(word);
  let result = abbr ? spellOut(word) : word;

  if (!abbr && resolved !== undefined) result = resolved;
  else if (result.includes("e")) result = applySchwa(result);
  if (result.endsWith("k")) result = `${result.slice(0, -1)}ʔ`;

  result = applyGlottalStops(result);
  return { phonemes: applyReplacements(result, PHONEME_REPLACEMENTS), abbr };
}

/**
 * Convert Indonesian text to IPA phonemes.
 *
 * Non-letter characters, including punctuation and digits, pass through
 * unchanged. The text is lowercased first.
 *
 * @param text The text to convert.
 * @param options Conversion options.
 * @returns The phonemic transcription and the syllables it is built from.
 *
 * @example
 * ```ts
 * const { phonemes } = toPhoneme("Tak seorang pun boleh ditangkap.");
 * // "taʔ seoraŋ pun boleh ditaŋkap."
 * ```
 */
export function toPhoneme(text: string, options: ToPhonemeOptions = {}): G2PResult {
  const lowered = text.toLowerCase();
  const matches = [...lowered.matchAll(WORD_PATTERN)];
  // The resolver sees the whole sentence at once, so it can use context.
  const resolved = options.resolveSchwa?.(matches.map((match) => match[0])) ?? [];

  const syllables: string[] = [];
  const parts: string[] = [];
  let cursor = 0;

  for (const [index, match] of matches.entries()) {
    const { phonemes, abbr } = wordToPhonemes(
      match[0],
      options.expandAbbr ?? false,
      resolved[index]
    );
    let wordSyllables = toSyllables(phonemes);

    // Diphthongs are only recognised inside a syllable, never across a break.
    if (!abbr && DIPHTHONGS.some(([pair]) => phonemes.includes(pair))) {
      wordSyllables = wordSyllables.map((syllable) => applyReplacements(syllable, DIPHTHONGS));
    }

    parts.push(lowered.slice(cursor, match.index), wordSyllables.join(""));
    cursor = match.index + match[0].length;
    syllables.push(...wordSyllables, " ");
  }

  parts.push(lowered.slice(cursor));
  return { phonemes: parts.join(""), syllables };
}

/**
 * Convert IPA phonemes back to Indonesian spelling.
 *
 * This is a best-effort inverse: `/ə/` and `/e/` both spell as `e`, and a
 * glottal stop always spells as `k`.
 *
 * @param text The phonemes to convert.
 * @returns The text in ordinary Indonesian spelling.
 */
export function toGrapheme(text: string): string {
  return applyReplacements(text, GRAPHEME_REPLACEMENTS);
}

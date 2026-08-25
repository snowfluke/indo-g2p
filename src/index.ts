// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Indonesian grapheme-to-phoneme conversion, ported from
 * {@link https://github.com/Wikidepia/g2p-id | Wikidepia/g2p-id}.
 *
 * @example
 * ```ts
 * import { toPhoneme } from "indo-g2p";
 *
 * const { phonemes, syllables } = toPhoneme("Saya pergi ke sekolah.");
 * console.log(phonemes); // "saja pərgi kə səkolah."
 * ```
 *
 * @module
 */

import { lookUpEnglish } from "./english.ts";
import { trace } from "./explain.ts";
import { convert } from "./g2p.ts";
import type { G2PResult, ToPhonemeOptions, WordTrace } from "./types.ts";

/**
 * Convert Indonesian text to IPA phonemes.
 *
 * Non-letter characters pass through unchanged, digits and symbols are spelled
 * out, and the text is lowercased first. English words are read as English;
 * pass `english: false` for the Indonesian rules, or import from
 * `indo-g2p/core` to leave the 2 MB English table out of the bundle entirely.
 *
 * @param text The text to convert.
 * @param options Conversion options.
 * @returns The phonemic transcription and the syllables it is built from.
 *
 * @example
 * ```ts
 * const { phonemes } = toPhoneme("Tak seorang pun boleh ditangkap.");
 * // "taʔ səoraŋ pun boleh ditaŋkap."
 * ```
 */
export function toPhoneme(text: string, options: ToPhonemeOptions = {}): G2PResult {
  return convert(text, options, lookUpEnglish);
}

export { toGrapheme } from "./g2p.ts";
export { toSyllables } from "./syllabifier.ts";
export { collocationRules, resolveCollocations } from "./collocations.ts";
export { englishWords, lookUpEnglish } from "./english.ts";
export { normalizeText } from "./normalize.ts";
export { spellDecimal, spellNumber } from "./number.ts";
export { applySchwa } from "./schwa.ts";
export type {
  EnglishLookup,
  G2PResult,
  PhonemeSource,
  SchwaResolver,
  SyllableTag,
  ToPhonemeOptions,
  WordTrace,
} from "./types.ts";
export { VERSION } from "./version.ts";

/**
 * Show where every word's pronunciation came from, reading English words as English.
 *
 * @param text The text to explain, handled exactly as {@linkcode toPhoneme}
 * would, including normalisation.
 * @param options The same options {@linkcode toPhoneme} takes.
 * @returns One entry per word, in order.
 *
 * @example
 * ```ts
 * explain("upacara apel di jakarta");
 * // [ { word: "upacara", phonemes: "upatʃara", source: "lexicon" },
 * //   { word: "apel",    phonemes: "apel",     source: "collocation" },
 * //   { word: "di",      phonemes: "di",       source: "rules" },
 * //   { word: "jakarta", phonemes: "dʒakarta", source: "lexicon" } ]
 * ```
 */
export function explain(text: string, options: ToPhonemeOptions = {}): WordTrace[] {
  return trace(text, options, lookUpEnglish);
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Indonesian grapheme-to-phoneme conversion, without the English table.
 *
 * Identical to `indo-g2p` except that English words are read by Indonesian
 * spelling rules, so `event` comes out `efent` rather than `ifent`. That drops
 * 2 MB from a bundle, which matters in a browser and does not on a server.
 *
 * Everything else is the same: the schwa dictionary, the lexicon, the affix
 * rules, homograph resolution, normalisation and syllabification all behave as
 * they do in the main entry point.
 *
 * @example
 * ```ts
 * import { toPhoneme } from "indo-g2p/core";
 *
 * toPhoneme("Saya pergi ke sekolah.").phonemes; // "saja pərgi kə səkolah."
 * ```
 *
 * @module
 */

import { convert } from "./g2p.ts";
import type { G2PResult, ToPhonemeOptions } from "./types.ts";

/**
 * Convert Indonesian text to IPA phonemes, reading English words as
 * Indonesian.
 *
 * @param text The text to convert.
 * @param options Conversion options. `english` is accepted and ignored, since
 * this entry point has no English table to consult.
 * @returns The phonemic transcription and the syllables it is built from.
 */
export function toPhoneme(text: string, options: ToPhonemeOptions = {}): G2PResult {
  return convert(text, options, undefined);
}

export { toGrapheme } from "./g2p.ts";
export { toSyllables } from "./syllabifier.ts";
export { collocationRules, resolveCollocations } from "./collocations.ts";
export { normalizeText } from "./normalize.ts";
export { spellDecimal, spellNumber } from "./number.ts";
export { applySchwa } from "./schwa.ts";
export type {
  G2PResult,
  PhonemeSource,
  SchwaResolver,
  SyllableTag,
  ToPhonemeOptions,
  WordTrace,
} from "./types.ts";
export { VERSION } from "./version.ts";

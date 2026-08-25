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

export { toGrapheme, toPhoneme } from "./g2p.ts";
export { toSyllables } from "./syllabifier.ts";
export { collocationRules, resolveCollocations } from "./collocations.ts";
export { applySchwa } from "./schwa.ts";
export type { G2PResult, SchwaResolver, SyllableTag, ToPhonemeOptions } from "./types.ts";
export { VERSION } from "./version.ts";

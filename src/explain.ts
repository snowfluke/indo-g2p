// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { resolveCollocations } from "./collocations.ts";
import { WORD_PATTERN } from "./constants.ts";
import { convert } from "./g2p.ts";
import { normalizeText } from "./normalize.ts";
import { schwaSource } from "./schwa.ts";
import type { EnglishLookup, ToPhonemeOptions, WordTrace } from "./types.ts";

/**
 * Show where every word's pronunciation came from.
 *
 * Five sources can answer for a word, and when one is wrong the useful
 * question is which one spoke. This answers it without making the caller read
 * the source, and is the fastest way to tell a bad dictionary entry from a bad
 * rule.
 *
 * The English lookup is passed in for the same reason {@linkcode convert}
 * takes one: `indo-g2p/core` must not pull the table in.
 *
 * @param text The text to explain, handled exactly as `toPhoneme` would,
 * including normalisation.
 * @param options The same options `toPhoneme` takes.
 * @param english Reads English words, or `undefined` to leave them to the
 * Indonesian rules.
 * @returns One entry per word, in order.
 *
 * @example
 * ```ts
 * explain("upacara apel di jakarta");
 * // [ { word: "upacara",  phonemes: "upatʃara", source: "lexicon" },
 * //   { word: "apel",     phonemes: "apel",     source: "collocation" },
 * //   { word: "di",       phonemes: "di",       source: "rules" },
 * //   { word: "jakarta",  phonemes: "dʒakarta", source: "lexicon" } ]
 * ```
 */
export function trace(
  text: string,
  options: ToPhonemeOptions,
  english: EnglishLookup | undefined
): WordTrace[] {
  const prepared = options.normalize === false ? text : normalizeText(text);
  const words = [...prepared.toLowerCase().matchAll(WORD_PATTERN)].map((match) => match[0]);

  // Resolved once, so the reported source cannot disagree with the phonemes.
  const lookup = options.english === false ? undefined : english;

  const resolver = options.resolveSchwa ?? resolveCollocations;
  const resolved = resolver === false ? [] : resolver(words);

  return words.map((word, index) => {
    // Asking for one word at a time keeps this honest: whatever `toPhoneme`
    // would do to the word in context is what gets reported.
    const single = convert(word, { ...options, normalize: false, resolveSchwa: false }, lookup);
    const phonemes =
      resolved[index] === undefined
        ? single.phonemes
        : convert(
            word,
            { ...options, normalize: false, resolveSchwa: () => [resolved[index]] },
            lookup
          ).phonemes;

    return { word, phonemes, source: sourceOf(word, lookup, resolved[index] !== undefined) };
  });
}

/** Work out which layer answered, in the order `wordToPhonemes` consults them. */
function sourceOf(
  word: string,
  english: EnglishLookup | undefined,
  byCollocation: boolean
): WordTrace["source"] {
  if (byCollocation) return "collocation";
  if (english?.(word) !== undefined) return "english";
  return schwaSource(word);
}

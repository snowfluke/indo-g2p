// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { hasHomograph, homographTable, resolveFromTags } from "./homograph-table.ts";
import { tagWords } from "./pos/tagger.ts";

/**
 * Resolve Indonesian homographs from their part of speech, synchronously.
 *
 * Some words are spelled alike but read differently: `apel` is `/apəl/` as a
 * noun (the fruit) and `/apel/` as a verb (roll call). This tags the sentence
 * with an averaged perceptron and picks the reading that matches.
 *
 * Pass it to {@linkcode toPhoneme} as `resolveSchwa`. It is a separate entry
 * point because it pulls in a 3.3 MB tagger that most callers do not need.
 *
 * @param words The words of one sentence, lowercased, in order.
 * @returns The resolved spelling per word, or `undefined` to fall back to the
 * schwa dictionary. `undefined` for every word when no homograph is present.
 *
 * @example
 * ```ts
 * import { toPhoneme } from "indo-g2p";
 * import { resolveHomographs } from "indo-g2p/homographs";
 *
 * toPhoneme("dia makan apel", { resolveSchwa: resolveHomographs }).phonemes;
 * // "dia makan apəl"
 * ```
 */
export function resolveHomographs(words: readonly string[]): (string | undefined)[] {
  if (!hasHomograph(words)) return words.map(() => undefined);
  return resolveFromTags(words, tagWords(words));
}

/** Every word this resolver knows how to disambiguate. */
export function knownHomographs(): string[] {
  return [...homographTable().keys()];
}

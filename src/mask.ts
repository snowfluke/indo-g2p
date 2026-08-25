// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Rewrite the `e`s selected by `mask` as `ə`.
 *
 * A schwa reading is stored as a bitmask over the word's `e`s rather than as a
 * second string, so the two readings cannot drift apart.
 *
 * This lives on its own so the default code path never has to import the
 * part-of-speech tables to get at it.
 *
 * @param word The word to rewrite.
 * @param mask Bit `i` set means the `i`-th `e` of the word is a schwa.
 * @returns The word with those vowels written as `ə`.
 */
export function applyMask(word: string, mask: number): string {
  let seen = 0;
  return [...word]
    .map((char) => {
      if (char !== "e") return char;
      const isSchwa = (mask >> seen) & 1;
      seen++;
      return isSchwa ? "ə" : char;
    })
    .join("");
}

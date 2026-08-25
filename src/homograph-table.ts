// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { HOMOGRAPHS } from "./data/homographs.ts";
import { POS_GROUPS } from "./data/pos-model.ts";

/**
 * One homograph's two readings, as schwa bitmasks over the word's `e`s, each
 * tied to the coarse POS class that selects it.
 */
type Homograph = { first: string; second: string; forFirst: number; forSecond: number };

let table: Map<string, Homograph> | undefined;

/** The homograph table, parsed on first use and shared afterwards. */
export function homographTable(): Map<string, Homograph> {
  if (table) return table;

  const parsed = new Map<string, Homograph>();
  for (const line of HOMOGRAPHS.split("\n")) {
    const [word, classes, forFirst, forSecond] = line.split(" ");
    if (word && classes && forFirst && forSecond) {
      parsed.set(word, {
        first: classes.slice(0, 1),
        second: classes.slice(1),
        forFirst: Number.parseInt(forFirst, 16),
        forSecond: Number.parseInt(forSecond, 16),
      });
    }
  }

  table = parsed;
  return parsed;
}

/** True when the sentence contains a word this table can disambiguate. */
export function hasHomograph(words: readonly string[]): boolean {
  const entries = homographTable();
  return words.some((word) => entries.has(word));
}

/**
 * Rewrite the `e`s selected by `mask` as `ə`.
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

/** True when `tag` belongs to the coarse class `name`, such as `N` or `V`. */
function inClass(name: string, tag: string): boolean {
  return POS_GROUPS[name]?.includes(tag) ?? false;
}

/**
 * Pick each homograph's reading from its POSP tag.
 *
 * A word is only resolved when its tag matches one of the two classes that
 * entry distinguishes. Any other tag - most often the tagger's fallback for a
 * word it never saw in training - is no evidence, so the reading is left to
 * the schwa dictionary rather than guessed. That is what stops the resolver
 * overriding curated data on nothing.
 *
 * @param words The words of one sentence, lowercased.
 * @param tags One POSP tag per word, such as `B-NNO`.
 * @returns The resolved spelling per word, or `undefined` where the schwa
 * dictionary should decide instead.
 */
export function resolveFromTags(
  words: readonly string[],
  tags: readonly string[]
): (string | undefined)[] {
  const entries = homographTable();

  return words.map((word, index) => {
    const entry = entries.get(word);
    if (!entry) return undefined;

    const tag = tags[index] ?? "";
    if (inClass(entry.first, tag)) return applyMask(word, entry.forFirst);
    if (inClass(entry.second, tag)) return applyMask(word, entry.forSecond);
    return undefined;
  });
}

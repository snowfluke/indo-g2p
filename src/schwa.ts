// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { affixSchwaMask } from "./affix.ts";
import { LEXICON } from "./data/lexicon.ts";
import { SCHWA_DICT } from "./data/schwa-dict.ts";
import { SCHWA_OVERRIDES } from "./data/schwa-overrides.ts";
import { applyMask } from "./mask.ts";

let masks: Map<string, number> | undefined;

/** The schwa dictionary, parsed on first use and shared afterwards. */
function schwaMasks(): Map<string, number> {
  if (masks) return masks;

  const parsed = new Map<string, number>();
  // Read weakest first, so a later source wins: Bookbot's lexicon fills gaps,
  // the curated dictionary overrules it on native vocabulary, and the
  // hand-written corrections in data/schwa-overrides.tsv overrule both.
  for (const source of [LEXICON, SCHWA_DICT, SCHWA_OVERRIDES]) {
    for (const line of source.split("\n")) {
      const space = line.lastIndexOf(" ");
      parsed.set(line.slice(0, space), Number.parseInt(line.slice(space + 1), 16));
    }
  }

  masks = parsed;
  return parsed;
}

/**
 * Rewrite the `e`s that are pronounced as a schwa `/ə/`, as in `təman`.
 *
 * Indonesian spelling does not distinguish `/e/` from `/ə/`, so three sources
 * are consulted in order of how much they are trusted:
 *
 * 1. The curated dictionary, plus the corrections in
 *    `data/schwa-overrides.tsv`.
 * 2. Bookbot's lexicon, for the 22,659 words the dictionary does not list.
 * 3. The affix rules in `affix.ts`, which need no word list at all.
 *
 * A word none of them can place is returned unchanged.
 *
 * @param word A single lowercase word.
 * @returns The word with schwa vowels written as `ə`.
 */
export function applySchwa(word: string): string {
  const masks = schwaMasks();
  // The dictionary is curated, so it always wins. Affix rules only speak for
  // words it has never seen, which is 28% of running text.
  const mask = masks.get(word) ?? affixSchwaMask(word, (root) => masks.get(root));
  return mask === undefined ? word : applyMask(word, mask);
}

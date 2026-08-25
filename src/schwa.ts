// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { affixSchwaMask } from "./affix.ts";
import { SCHWA_DICT } from "./data/schwa-dict.ts";
import { SCHWA_OVERRIDES } from "./data/schwa-overrides.ts";
import { applyMask } from "./mask.ts";

let masks: Map<string, number> | undefined;

/** The schwa dictionary, parsed on first use and shared afterwards. */
function schwaMasks(): Map<string, number> {
  if (masks) return masks;

  const parsed = new Map<string, number>();
  for (const source of [SCHWA_DICT, SCHWA_OVERRIDES]) {
    // Overrides are read last so they win. See data/schwa-overrides.tsv.
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
 * Indonesian spelling does not distinguish `/e/` from `/ə/`. A curated
 * dictionary answers first; a word it does not list falls back to the affix
 * rules in `affix.ts`, because the language derives most of its vocabulary by
 * prefixing roots and every such prefix carries a schwa. A word neither can
 * place is returned unchanged.
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

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { affixSchwaMask } from "./affix.ts";
import { LEXICON } from "./data/lexicon.ts";
import { SCHWA_DICT } from "./data/schwa-dict.ts";
import { SCHWA_OVERRIDES } from "./data/schwa-overrides.ts";
import { applyMask } from "./mask.ts";
import type { PhonemeSource } from "./types.ts";

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

/** One parsed table per source, built once, for reporting provenance. */
let bySource: Map<string, PhonemeSource> | undefined;

/**
 * Say which layer places a word, without converting it.
 *
 * Used by {@linkcode explain}. It costs a second pass over the tables, so it
 * is built only if something asks.
 *
 * @param word A single lowercase word.
 * @returns The layer that answers for it.
 */
export function schwaSource(word: string): PhonemeSource {
  if (!bySource) {
    const built = new Map<string, PhonemeSource>();
    for (const [source, packed] of [
      ["lexicon", LEXICON],
      ["dictionary", SCHWA_DICT],
      ["override", SCHWA_OVERRIDES],
    ] as const) {
      for (const line of packed.split("\n"))
        built.set(line.slice(0, line.lastIndexOf(" ")), source);
    }
    bySource = built;
  }

  const listed = bySource.get(word);
  if (listed) return listed;
  return affixSchwaMask(word, (root) => schwaMasks().get(root)) === undefined ? "rules" : "affix";
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { SCHWA_DICT } from "./data/schwa-dict.ts";

let masks: Map<string, number> | undefined;

/** The schwa dictionary, parsed on first use and shared afterwards. */
function schwaMasks(): Map<string, number> {
  if (masks) return masks;

  const parsed = new Map<string, number>();
  for (const line of SCHWA_DICT.split("\n")) {
    const space = line.lastIndexOf(" ");
    parsed.set(line.slice(0, space), Number.parseInt(line.slice(space + 1), 16));
  }

  masks = parsed;
  return parsed;
}

/**
 * Rewrite the `e`s that are pronounced as a schwa `/ə/`, as in `təman`.
 *
 * Indonesian spelling does not distinguish `/e/` from `/ə/`, so this is a
 * dictionary lookup. Words that are not listed are returned unchanged.
 *
 * @param word A single lowercase word.
 * @returns The word with schwa vowels written as `ə`.
 */
export function applySchwa(word: string): string {
  const mask = schwaMasks().get(word);
  if (mask === undefined) return word;

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

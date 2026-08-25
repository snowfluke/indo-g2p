// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { ENGLISH } from "./data/english.ts";

let table: Map<string, string> | undefined;

/** The English table, parsed on first use and shared afterwards. */
function english(): Map<string, string> {
  if (table) return table;

  const parsed = new Map<string, string>();
  for (const line of ENGLISH.split("\n")) {
    const space = line.lastIndexOf(" ");
    parsed.set(line.slice(0, space), line.slice(space + 1));
  }

  table = parsed;
  return parsed;
}

/**
 * Look up an English word that Indonesian spelling rules would mangle.
 *
 * Indonesian text carries English words, and reading them as Indonesian turns
 * `event` into `efent`. This returns the English pronunciation instead,
 * written in the phoneme set the rest of the library emits, which is the
 * approximation an Indonesian speaker makes anyway.
 *
 * The table is built so that it can only ever answer for words no Indonesian
 * source places: anything in the dictionary, the lexicon, or
 * `data/indonesian-proper-nouns.tsv` is left out of it. That is what keeps
 * `jakarta` and `april` from being read as English.
 *
 * @param word A single lowercase word.
 * @returns Its phonemes, or `undefined` if the word is not English enough to
 * be in the table.
 *
 * @example
 * ```ts
 * lookUpEnglish("event"); // "ifent"
 * lookUpEnglish("makan"); // undefined
 * ```
 */
export function lookUpEnglish(word: string): string | undefined {
  return english().get(word);
}

/** Every English word the table can answer for. */
export function englishWords(): string[] {
  return [...english().keys()];
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { ENGLISH } from "./data/english.ts";

/**
 * Find one word in a sorted, newline-separated table of `word value` lines.
 *
 * The table holds 113,140 entries. Turning it into a `Map` costs 22 ms and
 * 25 MB before the first word is converted, which is most of this library's
 * startup and nearly all of its memory. Since the table is already sorted, a
 * binary search over the packed string costs neither: no parse, no allocation
 * beyond the matched line, and about seventeen probes for a lookup.
 *
 * @param text The sorted table.
 * @param word The word to find.
 * @returns The value after the word's last space, or `undefined`.
 */
function search(text: string, word: string): string | undefined {
  let low = 0;
  let high = text.length;

  while (low < high) {
    const probe = (low + high) >> 1;
    // A probe lands mid-line, so step back to that line's first character.
    const start = probe === 0 ? 0 : text.lastIndexOf("\n", probe - 1) + 1;
    let end = text.indexOf("\n", start);
    if (end === -1) end = text.length;

    const space = text.lastIndexOf(" ", end);
    const candidate = text.slice(start, space);
    if (candidate === word) return text.slice(space + 1, end);

    // `high = start` always shrinks the range because start <= probe, and
    // `low = end + 1` always grows it past the probe, so this terminates.
    if (candidate < word) low = end + 1;
    else high = start;
  }

  return undefined;
}

/** Marks a word already looked up and known not to be in the table. */
const MISS = "\0";

const seen = new Map<string, string>();

/**
 * Look up an English word that Indonesian spelling rules would mangle.
 *
 * Indonesian text carries English words and foreign names, and reading them as
 * Indonesian turns `event` into `efent` and `denny` into `dennj`. This returns
 * the English pronunciation instead, written in the phoneme set the rest of
 * the library emits, which is the approximation an Indonesian speaker makes
 * anyway.
 *
 * The table is built so it can only ever answer for words no Indonesian source
 * places: anything in the dictionary, the lexicon, or
 * `data/indonesian-proper-nouns.tsv` is left out of it. That is what keeps
 * `jakarta` and `april` from being read as English.
 *
 * @param word A single lowercase word.
 * @returns Its phonemes, or `undefined` if the table does not carry it.
 *
 * @example
 * ```ts
 * lookUpEnglish("event"); // "ifent"
 * lookUpEnglish("makan"); // undefined
 * ```
 */
export function lookUpEnglish(word: string): string | undefined {
  const remembered = seen.get(word);
  if (remembered !== undefined) return remembered === MISS ? undefined : remembered;

  const found = search(ENGLISH, word);
  // Real text repeats itself, so remembering what a word resolved to buys back
  // the speed of a `Map` without paying to build one. Misses are remembered
  // too, since most Indonesian words are misses and they are the common case.
  seen.set(word, found ?? MISS);
  return found;
}

/**
 * Every English word the table can answer for.
 *
 * This walks the whole table, so it allocates the 113,140 strings that
 * {@linkcode lookUpEnglish} exists to avoid. It is here for inspection, not
 * for use in a conversion loop.
 */
export function englishWords(): string[] {
  return ENGLISH.split("\n").map((line) => line.slice(0, line.lastIndexOf(" ")));
}

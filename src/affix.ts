// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Indonesian prefixes whose vowel is always a schwa.
 *
 * Longest first, so `ter-` is tried before `te-` and the root of `tersebut`
 * comes out as `sebut` rather than `rsebut`.
 */
const SCHWA_PREFIXES: readonly string[] = [
  "memper",
  "member",
  "seper",
  "meng",
  "meny",
  "mem",
  "men",
  "peng",
  "peny",
  "pem",
  "pen",
  "ber",
  "bel",
  "ter",
  "tel",
  "per",
  "pel",
  "me",
  "pe",
  "be",
  "te",
  "se",
  "ke",
];

/** Suffixes stripped when looking for a root. None of them contains an `e`. */
const SUFFIXES: readonly string[] = [
  "kannya",
  "annya",
  "nya",
  "kan",
  "an",
  "lah",
  "kah",
  "pun",
  "i",
];

/**
 * What an Indonesian root may start with: a vowel, one consonant, or one of
 * the clusters the language allows.
 *
 * This is what stops `teknologi` being read as `te` + `knologi`, since `kn` is
 * not a possible onset, and with it the loanwords that merely happen to begin
 * with a prefix's letters.
 */
const ROOT_ONSET =
  /^([aiueo]|ng[aiueo]|ny[aiueo]|sy[aiueo]|kh[aiueo]|[pbtdkgfsr]r[aiueo]|[pbkgf]l[aiueo]|s[ptkw][aiueo]|[bcdfghjklmnpqrstvwxyz][aiueoy])/;

/** How many affix layers to peel before giving up. */
const MAX_DEPTH = 3;

/** Looks a word up in the schwa dictionary. */
export type SchwaLookup = (word: string) => number | undefined;

/**
 * Work out which `e`s of a derived word are schwas, from its affixes.
 *
 * The schwa dictionary lists roots, but Indonesian builds most of its
 * vocabulary by affixing them, so 28% of running text misses it. Every prefix
 * in {@linkcode SCHWA_PREFIXES} carries a schwa, which is a fact about the
 * language rather than about any word list, so the prefix vowel can be marked
 * without knowing the root at all. The root is then looked up, or peeled
 * again, and left alone when it is unknown.
 *
 * Scored against the dictionary itself, guessing each known word as if it were
 * missing, this gets the prefix vowel right 96.8% of the time.
 *
 * @param word A lowercase word that is not in the dictionary.
 * @param lookup Reads the dictionary, used for the root.
 * @param depth Recursion guard; callers pass nothing.
 * @returns The schwa bitmask, or `undefined` when no prefix applies.
 */
export function affixSchwaMask(word: string, lookup: SchwaLookup, depth = 0): number | undefined {
  if (depth >= MAX_DEPTH) return undefined;

  for (const prefix of SCHWA_PREFIXES) {
    if (!word.startsWith(prefix) || word.length <= prefix.length + 1) continue;

    const rest = word.slice(prefix.length);
    if (!ROOT_ONSET.test(rest)) continue;

    const prefixVowels = (prefix.match(/e/g) ?? []).length;
    const prefixMask = (1 << prefixVowels) - 1;
    const rootMask = resolveRoot(rest, lookup, depth);

    // An unknown root keeps its own `e`s, so only the prefix is claimed.
    return rootMask === undefined ? prefixMask : prefixMask | (rootMask << prefixVowels);
  }

  return undefined;
}

/** Resolve the part after a prefix, peeling one suffix if that is what it takes. */
function resolveRoot(rest: string, lookup: SchwaLookup, depth: number): number | undefined {
  const direct = lookup(rest) ?? affixSchwaMask(rest, lookup, depth + 1);
  if (direct !== undefined) return direct;

  for (const suffix of SUFFIXES) {
    if (!rest.endsWith(suffix) || rest.length <= suffix.length + 1) continue;
    const stem = rest.slice(0, rest.length - suffix.length);
    const mask = lookup(stem) ?? affixSchwaMask(stem, lookup, depth + 1);
    if (mask !== undefined) return mask;
  }

  return undefined;
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Result of converting Indonesian text to phonemes.
 */
export type G2PResult = {
  /** The input text with every word rewritten in IPA. Punctuation and spacing are kept. */
  phonemes: string;
  /** Every syllable in reading order. A single space marks the end of a word. */
  syllables: string[];
};

/**
 * Decides which `e`s of each word are a schwa, given the whole sentence.
 *
 * Return `undefined` for a word to fall back to the built-in schwa dictionary.
 * `resolveHomographs` from `indo-g2p/homographs` is one such resolver; a
 * model-backed one can be dropped in the same way.
 */
export type SchwaResolver = (words: readonly string[]) => readonly (string | undefined)[];

/**
 * Options for {@linkcode toPhoneme}.
 */
export type ToPhonemeOptions = {
  /**
   * Spell out words that have no valid syllable shape, such as `tv` to `tévé`.
   * Defaults to `false`.
   */
  expandAbbr?: boolean;

  /**
   * Override the schwa decision with sentence context, for homographs.
   * Defaults to the built-in dictionary alone.
   */
  resolveSchwa?: SchwaResolver;
};

/**
 * A syllable boundary tag from the CRF model.
 * `O` continues the current syllable, `S` closes it.
 */
export type SyllableTag = "O" | "S";

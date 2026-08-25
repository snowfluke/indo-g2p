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
   * Spell out words that have no valid syllable shape, such as `tv` to `téfé`.
   * Defaults to `false`.
   */
  expandAbbr?: boolean;

  /**
   * Spell out digits, currency, percentages and symbols before converting,
   * and fold typographic quotes and dashes onto the plain ones.
   *
   * On by default: a speech model has no phoneme for `5` or `%`, so leaving
   * them in means they are dropped or fail. Set `false` to pass the text
   * through untouched, which a caller doing its own normalisation wants.
   * See {@linkcode normalizeText}.
   */
  normalize?: boolean;

  /**
   * Read English words with English pronunciation rather than Indonesian
   * spelling rules, so `event` is not `efent`.
   *
   * On by default. Only words no Indonesian source places are eligible, and
   * proper nouns are excluded by name, so this never touches `jakarta`.
   */
  english?: boolean;

  /**
   * How homographs are resolved.
   *
   * Defaults to the built-in collocation rules, which read the words around
   * each homograph. Pass a {@linkcode SchwaResolver} to use your own, such as
   * `resolveHomographs` from `indo-g2p/homographs`, or `false` to resolve
   * nothing and let the schwa dictionary decide every word.
   */
  resolveSchwa?: SchwaResolver | false;
};

/**
 * Which layer decided a word's pronunciation.
 *
 * - `override` a hand-written correction in `data/schwa-overrides.tsv`
 * - `dictionary` the curated 17,888-word schwa dictionary
 * - `lexicon` Bookbot's lexicon, for words the dictionary does not list
 * - `affix` the prefix rules, for words neither list places
 * - `english` the English table, for words no Indonesian source places
 * - `collocation` a homograph settled by the words around it
 * - `rules` no word list applied; spelling rules alone
 */
export type PhonemeSource =
  | "override"
  | "dictionary"
  | "lexicon"
  | "affix"
  | "english"
  | "collocation"
  | "rules";

/**
 * One word, its phonemes, and which layer produced them.
 */
export type WordTrace = {
  /** The word as it reached the converter, lowercased and after normalisation. */
  word: string;
  /** Its phonemes, exactly as they appear in the full transcription. */
  phonemes: string;
  /** Which layer answered. See {@linkcode PhonemeSource}. */
  source: PhonemeSource;
};

/**
 * A syllable boundary tag from the CRF model.
 * `O` continues the current syllable, `S` closes it.
 */
export type SyllableTag = "O" | "S";

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { stateFeatures, transition } from "./crf-model.ts";

/** Label indices used by the model: `O` continues a syllable, `S` closes it. */
const CONTINUE = 0;
const BOUNDARY = 1;

/** Characters of look-behind and look-ahead per position. */
const CONTEXT = 5;

/** Per-label scores at one character position. */
type Scores = { continue: number; boundary: number };

/**
 * Build the CRF attributes for character `index` of `word`.
 * The names must match the ones the upstream model was trained with.
 */
function attributesAt(word: string, index: number): string[] {
  const last = word.length - 1;
  const attrs = ["bias", `c=${word[index]}`];

  if (index > 0) attrs.push(`c[-1:0]=${word.slice(index - 1, index + 1)}`);
  if (index > 1) attrs.push(`c[-2:0]=${word.slice(index - 2, index + 1)}`);
  if (index < last) attrs.push(`c[0:+1]=${word.slice(index, index + 2)}`);
  if (index < last - 1) attrs.push(`c[0:+2]=${word.slice(index, index + 3)}`);

  for (let n = 1; n <= Math.min(CONTEXT, index); n++) attrs.push(`c[-${n}]=${word[index - n]}`);
  for (let n = 1; n <= Math.min(CONTEXT, last - index); n++) {
    attrs.push(`c[+${n}]=${word[index + n]}`);
  }

  if (index === 0) attrs.push("BOS");
  if (index === last) attrs.push("EOS");
  return attrs;
}

/** Sum the state weights of every attribute the model knows about. */
function emissionsAt(word: string, index: number): Scores {
  const model = stateFeatures();
  const scores: Scores = { continue: 0, boundary: 0 };

  for (const attr of attributesAt(word, index)) {
    const weights = model.get(attr);
    if (weights) {
      scores.continue += weights[0];
      scores.boundary += weights[1];
    }
  }
  return scores;
}

/**
 * Best predecessor label for `to`, and the score it carries.
 * crfsuite compares with a strict `>`, so `O` wins a tie.
 */
function bestPrevious(scores: Scores, to: number): { from: number; score: number } {
  const viaContinue = scores.continue + transition(CONTINUE, to);
  const viaBoundary = scores.boundary + transition(BOUNDARY, to);
  return viaBoundary > viaContinue
    ? { from: BOUNDARY, score: viaBoundary }
    : { from: CONTINUE, score: viaContinue };
}

/** Viterbi decode. Returns one label index per character. */
function decode(word: string): number[] {
  let scores = emissionsAt(word, 0);
  const backpointers: [number, number][] = [];

  for (let index = 1; index < word.length; index++) {
    const emissions = emissionsAt(word, index);
    const toContinue = bestPrevious(scores, CONTINUE);
    const toBoundary = bestPrevious(scores, BOUNDARY);

    backpointers.push([toContinue.from, toBoundary.from]);
    scores = {
      continue: toContinue.score + emissions.continue,
      boundary: toBoundary.score + emissions.boundary,
    };
  }

  const tags: number[] = Array.from({ length: word.length }, () => CONTINUE);
  tags[word.length - 1] = scores.boundary > scores.continue ? BOUNDARY : CONTINUE;
  for (let index = backpointers.length - 1; index >= 0; index--) {
    tags[index] = backpointers[index]?.[tags[index + 1] ?? CONTINUE] ?? CONTINUE;
  }
  return tags;
}

/**
 * Split a word into syllables with the CRF model ported from g2p-id.
 *
 * The model was trained on plain uppercase letters, so `é` is folded to `e`
 * before tagging. The returned syllables keep the original characters.
 *
 * @param word A single word, already lowercased.
 * @returns The syllables in order. An empty word yields `[""]`.
 *
 * @example
 * ```ts
 * toSyllables("sekolah"); // ["se", "ko", "lah"]
 * ```
 */
export function toSyllables(word: string): string[] {
  if (word.length === 0) return [""];

  const tags = decode(word.replaceAll("é", "e").toUpperCase());
  const syllables: string[] = [];
  let current = "";

  for (let index = 0; index < word.length; index++) {
    current += word.charAt(index);
    if (tags[index] === BOUNDARY) {
      syllables.push(current);
      current = "";
    }
  }

  // A trailing boundary leaves an empty tail, which upstream keeps.
  syllables.push(current);
  return syllables;
}

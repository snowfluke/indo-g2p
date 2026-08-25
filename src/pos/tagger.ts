// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { TAG_DICT, TAGS, WEIGHTS } from "../data/pos-model.ts";

/** Sentence boundary padding the model was trained with. */
const START = ["-START-", "-START2-"];
const END = ["-END-", "-END2-"];

/** Weights for one feature, flattened as `[tagIndex, weight, ...]`. */
type Model = { weights: Map<string, number[]>; known: Map<string, number> };

let model: Model | undefined;

function parse(): Model {
  if (model) return model;

  const weights = new Map<string, number[]>();
  for (const line of WEIGHTS.split("\n")) {
    const tab = line.indexOf("\t");
    const pairs: number[] = [];
    for (const pair of line.slice(tab + 1).split(",")) {
      const colon = pair.indexOf(":");
      pairs.push(Number(pair.slice(0, colon)), Number(pair.slice(colon + 1)));
    }
    weights.set(line.slice(0, tab), pairs);
  }

  const known = new Map<string, number>();
  for (const line of TAG_DICT.split("\n")) {
    const tab = line.indexOf("\t");
    known.set(line.slice(0, tab), Number(line.slice(tab + 1)));
  }

  model = { weights, known };
  return model;
}

/** Lower case, and collapse digits the way the training data did. */
function normalize(word: string): string {
  if (word.includes("-") && !word.startsWith("-")) return "!HYPHEN";
  if (/^\d+$/.test(word)) return word.length === 4 ? "!YEAR" : "!DIGITS";
  if (/^\d/.test(word)) return "!DIGITS";
  return word.toLowerCase();
}

/**
 * The feature set the averaged perceptron was trained with. The names are
 * load-bearing: changing one silently invalidates every weight.
 */
function featuresAt(
  index: number,
  word: string,
  context: readonly string[],
  prev: string,
  prev2: string
): string[] {
  const i = index + START.length;
  const at = (offset: number): string => context[i + offset] ?? "";
  const suffix = (text: string): string => text.slice(-3);

  return [
    "bias",
    `i suffix ${suffix(word)}`,
    `i pref1 ${word.charAt(0)}`,
    `i-1 tag ${prev}`,
    `i-2 tag ${prev2}`,
    `i tag+i-2 tag ${prev} ${prev2}`,
    `i word ${at(0)}`,
    `i-1 tag+i word ${prev} ${at(0)}`,
    `i-1 word ${at(-1)}`,
    `i-1 suffix ${suffix(at(-1))}`,
    `i-2 word ${at(-2)}`,
    `i+1 word ${at(1)}`,
    `i+1 suffix ${suffix(at(1))}`,
    `i+2 word ${at(2)}`,
  ];
}

/**
 * Highest scoring tag. Ties go to the alphabetically later tag, which is what
 * Python's `max(classes, key=lambda l: (scores[l], l))` does.
 */
function predict(features: readonly string[], weights: Map<string, number[]>): string {
  const scores = new Float64Array(TAGS.length);
  for (const feature of features) {
    const pairs = weights.get(feature);
    if (!pairs) continue;
    for (let i = 0; i < pairs.length; i += 2) {
      const tag = pairs[i] ?? 0;
      scores[tag] = (scores[tag] ?? 0) + (pairs[i + 1] ?? 0);
    }
  }

  let best = 0;
  for (let tag = 1; tag < TAGS.length; tag++) {
    if ((scores[tag] ?? 0) >= (scores[best] ?? 0)) best = tag;
  }
  return TAGS[best] ?? "";
}

/**
 * Tag Indonesian words with the POSP tagset, using the averaged perceptron
 * ported from Bookbot's g2p_id.
 *
 * @param words The words of one sentence, in order.
 * @returns One POSP tag per word, such as `B-NNO` or `B-VBT`.
 *
 * @example
 * ```ts
 * tagWords(["dia", "makan", "apel"]); // ["B-PRN", "B-VBT", "B-NNO"]
 * ```
 */
export function tagWords(words: readonly string[]): string[] {
  const { weights, known } = parse();
  const context = [...START, ...words.map(normalize), ...END];
  const tags: string[] = [];

  let prev = START[0] ?? "";
  let prev2 = START[1] ?? "";

  for (const [index, word] of words.entries()) {
    const shortcut = known.get(word);
    const tag =
      shortcut === undefined
        ? predict(featuresAt(index, word, context, prev, prev2), weights)
        : (TAGS[shortcut] ?? "");

    tags.push(tag);
    prev2 = prev;
    prev = tag;
  }

  return tags;
}

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { STATE_FEATURES, TRANSITIONS } from "./data/syllabifier-model.ts";

/** State feature weights for one attribute, indexed by label: `[O, S]`. */
export type StateWeights = readonly [number, number];

let features: Map<string, StateWeights> | undefined;

/**
 * The model's state features, parsed on first use and shared afterwards.
 *
 * Each packed line is `attr\tw` for the common antisymmetric case
 * (`O` scores `w`, `S` scores `-w`) or `attr\twO\twS` when the two weights
 * are independent.
 */
export function stateFeatures(): Map<string, StateWeights> {
  if (features) return features;

  const parsed = new Map<string, StateWeights>();
  for (const line of STATE_FEATURES.split("\n")) {
    const first = line.indexOf("\t");
    const second = line.indexOf("\t", first + 1);
    const attr = line.slice(0, first);

    if (second === -1) {
      const weight = Number(line.slice(first + 1));
      parsed.set(attr, [weight, -weight]);
    } else {
      parsed.set(attr, [Number(line.slice(first + 1, second)), Number(line.slice(second + 1))]);
    }
  }

  features = parsed;
  return parsed;
}

/** Transition weight from label `from` to label `to`, both indexed `0 = O`, `1 = S`. */
export function transition(from: number, to: number): number {
  return TRANSITIONS[from * 2 + to] ?? 0;
}

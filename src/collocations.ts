// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { COLLOCATION_WINDOW, COLLOCATIONS } from "./data/collocations.ts";
import { applyMask } from "./mask.ts";
import { NUMBER_WORDS } from "./number.ts";

/** One homograph's non-default reading, and the words that select it. */
type Collocation = { mask: number; triggers: ReadonlySet<string> };

let rules: Map<string, Collocation> | undefined;

/** The collocation rules, parsed on first use and shared afterwards. */
function collocations(): Map<string, Collocation> {
  if (rules) return rules;

  const parsed = new Map<string, Collocation>();
  for (const line of COLLOCATIONS.split("\n")) {
    const [word, mask, ...triggers] = line.split(" ");
    if (word && mask && triggers.length > 0) {
      parsed.set(word, { mask: Number.parseInt(mask, 16), triggers: new Set(triggers) });
    }
  }

  rules = parsed;
  return parsed;
}

/**
 * Resolve homographs from the words around them.
 *
 * A homograph keeps its dictionary reading unless one of its trigger words is
 * within {@linkcode COLLOCATION_WINDOW} words: `apel` is the fruit by default
 * and the roll call next to `upacara` or `lapangan`.
 *
 * This is the default resolver for {@linkcode toPhoneme}. It is deterministic,
 * needs no model, and costs a set lookup per word. Where a rule does not
 * match, the schwa dictionary decides, so a missing trigger costs nothing.
 *
 * @param words The words of one sentence, lowercased, in order.
 * @returns The resolved spelling per word, or `undefined` to leave the word to
 * the schwa dictionary.
 *
 * @example
 * ```ts
 * resolveCollocations(["kami", "apel", "di", "lapangan"]);
 * // [undefined, "apel", undefined, undefined]
 * ```
 */
export function resolveCollocations(words: readonly string[]): (string | undefined)[] {
  const rulesByWord = collocations();

  return words.map((word, index) => {
    const rule = rulesByWord.get(word);
    if (!rule) return undefined;

    // Walk outwards, spending the window on real words only. Normalisation
    // turns `17` into `tujuh belas`, and a number is one thing said in several
    // words, so counting each of them would push the trigger out of reach.
    for (const step of [-1, 1]) {
      let spent = 0;
      for (let near = index + step; near >= 0 && near < words.length; near += step) {
        const other = words[near] ?? "";
        if (rule.triggers.has(other)) return applyMask(word, rule.mask);
        if (NUMBER_WORDS.has(other)) continue;
        if (++spent >= COLLOCATION_WINDOW) break;
      }
    }
    return undefined;
  });
}

/** Every word the collocation rules can act on, and what triggers each. */
export function collocationRules(): { word: string; triggers: string[] }[] {
  return [...collocations()].map(([word, rule]) => ({ word, triggers: [...rule.triggers] }));
}

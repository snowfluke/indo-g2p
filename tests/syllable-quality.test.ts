// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { toPhoneme } from "../src/index.ts";
import { KNOWN_IMPROVEMENTS } from "./known-improvements.ts";

describe("every syllable has a vowel", () => {
  test.each([
    // The model was trained on Indonesian and is fed English phonemes for
    // words the English table answers, where it cut `beautiful` into b|ju|tə|fəl.
    ["beautiful", ["bju", "tə", "fəl"]],
    ["queue", ["kju"]],
    ["school", ["skul"]],
  ])("%s", (word, expected) => {
    expect(toPhoneme(word).syllables.filter((s) => s !== " ")).toEqual(expected);
  });

  test("no syllable anywhere lacks a nucleus", () => {
    const words = ["sekolah", "cerdas", "bangsa", "periksa", "beautiful", "strength", "queue"];
    for (const word of words) {
      for (const syllable of toPhoneme(word).syllables) {
        if (syllable === " ") continue;
        expect(syllable).toMatch(/[aiueoəɪʊɔ]/);
      }
    }
  });
});

test("the parity allowlist has no duplicate keys", () => {
  // The allowlist becomes a Map, and a repeated upstream string would silently
  // discard the earlier entry with no word from tsc or oxlint. Keeping it as an
  // array means the collision is countable. Nothing collides today; this fails
  // the build if that ever changes.
  const keys = KNOWN_IMPROVEMENTS.map(([upstream]) => upstream);
  expect(new Set(keys).size).toBe(keys.length);
});

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { lookUpEnglish, toPhoneme } from "../src/index.ts";
import { ENGLISH } from "../src/data/english.ts";
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

describe("english lookup", () => {
  test("agrees with a map built from the same table", () => {
    const map = new Map(
      ENGLISH.split("\n").map((line) => {
        const at = line.lastIndexOf(" ");
        return [line.slice(0, at), line.slice(at + 1)] as const;
      })
    );
    const wrong: string[] = [];
    for (const [word, phonemes] of map) {
      if (lookUpEnglish(word) !== phonemes) wrong.push(word);
    }
    expect({ checked: map.size > 100_000, wrong: wrong.slice(0, 5) }).toEqual({
      checked: true,
      wrong: [],
    });
  });

  test.each(["", "a", "zzzzzz", "makan", "aaaaaa"])("misses %p cleanly", (word) => {
    expect(lookUpEnglish(word)).toBeUndefined();
  });

  test("the first and last rows are reachable", () => {
    // An off-by-one at either end of the search would only show up here.
    const lines = ENGLISH.split("\n");
    for (const line of [lines.at(0) ?? "", lines.at(-1) ?? ""]) {
      const at = line.lastIndexOf(" ");
      expect(lookUpEnglish(line.slice(0, at))).toBe(line.slice(at + 1));
    }
  });
});

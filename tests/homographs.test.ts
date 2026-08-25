// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { toPhoneme } from "../src/index.ts";
import { knownHomographs, resolveHomographs } from "../src/homographs.ts";
import { tagWords } from "../src/pos/tagger.ts";
import cases from "./fixtures/pos-tags.json" with { type: "json" };

const fixtures: string[][][] = cases;

describe("POS tagger", () => {
  test("matches the Python averaged perceptron on every fixture", () => {
    const mismatches: string[] = [];
    let total = 0;

    for (const [words = [], expected = []] of fixtures) {
      const got = tagWords(words);
      total += words.length;
      for (const [index, word] of words.entries()) {
        if (got[index] !== expected[index]) {
          mismatches.push(`${word}: ${got[index]} != ${expected[index]}`);
        }
      }
    }

    expect({ total: total > 4000, sample: mismatches.slice(0, 5) }).toEqual({
      total: true,
      sample: [],
    });
  });

  test("handles digits and hyphens the way the training data did", () => {
    expect(tagWords(["tahun", "2024", "ini"])).toHaveLength(3);
    expect(tagWords([])).toEqual([]);
  });
});

describe("homograph resolution", () => {
  test("picks the noun reading of apel", () => {
    const { phonemes } = toPhoneme("dia makan apel merah", { resolveSchwa: resolveHomographs });
    expect(phonemes).toBe("dia makan apəl mərah");
  });

  test("leaves words it does not know to the dictionary", () => {
    const plain = toPhoneme("saya pergi ke sekolah").phonemes;
    const resolved = toPhoneme("saya pergi ke sekolah", {
      resolveSchwa: resolveHomographs,
    }).phonemes;
    expect(resolved).toBe(plain);
  });

  test("skips tagging entirely when no homograph is present", () => {
    expect(resolveHomographs(["saya", "pergi"])).toEqual([undefined, undefined]);
  });

  test("knows only the homographs verified against Wiktionary", () => {
    expect(knownHomographs()).toContain("apel");
    expect(knownHomographs()).toHaveLength(11);
  });

  test("a custom resolver overrides the dictionary", () => {
    const always = (words: readonly string[]): (string | undefined)[] =>
      words.map((word) => (word === "sekolah" ? "sekolah" : undefined));
    expect(toPhoneme("sekolah", { resolveSchwa: always }).phonemes).toBe("sekolah");
    expect(toPhoneme("sekolah").phonemes).toBe("səkolah");
  });

  test("abbreviation expansion wins over the resolver", () => {
    const { phonemes } = toPhoneme("tv", {
      expandAbbr: true,
      resolveSchwa: () => ["never"],
    });
    expect(phonemes).toBe("téfé");
  });
});

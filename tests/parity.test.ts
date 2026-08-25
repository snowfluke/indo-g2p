// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { expect, test } from "bun:test";
import { toGrapheme, toPhoneme } from "../src/index.ts";
import cases from "./fixtures/parity.json" with { type: "json" };

type ParityCase = {
  text: string;
  expandAbbr: boolean;
  phonemes: string;
  syllables: string[];
  grapheme: string;
};

const fixtures: ParityCase[] = cases;

test("matches the upstream Python implementation on every fixture", () => {
  const mismatches: string[] = [];

  for (const item of fixtures) {
    const { phonemes, syllables } = toPhoneme(item.text, { expandAbbr: item.expandAbbr });
    if (phonemes !== item.phonemes) {
      mismatches.push(`phonemes ${JSON.stringify(item.text)}: ${phonemes} != ${item.phonemes}`);
    }
    if (syllables.join("|") !== item.syllables.join("|")) {
      mismatches.push(
        `syllables ${JSON.stringify(item.text)}: ${syllables.join("|")} != ${item.syllables.join("|")}`
      );
    }
    if (toGrapheme(phonemes) !== item.grapheme) {
      mismatches.push(
        `grapheme ${JSON.stringify(item.text)}: ${toGrapheme(phonemes)} != ${item.grapheme}`
      );
    }
  }

  expect({ count: mismatches.length, sample: mismatches.slice(0, 10) }).toEqual({
    count: 0,
    sample: [],
  });
});

test("fixture corpus is not empty", () => {
  expect(fixtures.length).toBeGreaterThan(500);
});

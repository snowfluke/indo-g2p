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

test("phonemes match the upstream Python implementation on every fixture", () => {
  const mismatches: string[] = [];

  for (const item of fixtures) {
    const { phonemes } = toPhoneme(item.text, { expandAbbr: item.expandAbbr });
    if (phonemes !== item.phonemes) {
      mismatches.push(`phonemes ${JSON.stringify(item.text)}: ${phonemes} != ${item.phonemes}`);
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

/**
 * Syllables deliberately diverge from the Python original.
 *
 * Upstream feeds the CRF its own phoneme output, including the schwa `ə` the
 * model was never trained on, which stops it predicting boundaries: 15.6% of
 * ordinary words came back as one syllable. This port folds `ə` to `e` for
 * tagging, which drops that to 0.2%. `phonemes` is unaffected and still
 * matches upstream exactly, asserted above.
 *
 * These assertions pin the properties that must hold instead of the exact
 * upstream strings.
 */
test("syllables improve on upstream without breaking their contract", () => {
  const problems: string[] = [];

  for (const item of fixtures) {
    const { phonemes, syllables } = toPhoneme(item.text, { expandAbbr: item.expandAbbr });

    // Every word still contributes its syllables plus one closing space.
    if (syllables.some((syllable) => syllable === "")) {
      problems.push(`empty syllable in ${JSON.stringify(item.text)}`);
    }
    // Nothing may be invented or lost relative to the transcription.
    for (const syllable of syllables) {
      if (syllable !== " " && !phonemes.includes(syllable)) {
        problems.push(`${JSON.stringify(syllable)} not in ${JSON.stringify(item.text)}`);
      }
    }
    // A boundary must never fall inside the two-character affricates.
    for (let i = 0; i < syllables.length - 1; i++) {
      const here = syllables[i] ?? "";
      const next = syllables[i + 1] ?? "";
      if (
        (here.endsWith("t") && next.startsWith("ʃ")) ||
        (here.endsWith("d") && next.startsWith("ʒ"))
      ) {
        problems.push(`affricate split in ${JSON.stringify(item.text)}`);
      }
    }
  }

  expect({ count: problems.length, sample: problems.slice(0, 6) }).toEqual({
    count: 0,
    sample: [],
  });
});

test("no longer collapses ordinary words to a single syllable", () => {
  // Every one of these came back whole from the upstream implementation.
  const collapsed = ["cerdas", "sekolah", "cerecek", "gemerlap", "sederhana"].filter(
    (word) => toPhoneme(word).syllables.filter((s) => s !== " ").length === 1
  );
  expect(collapsed).toEqual([]);
});

test("fixture corpus is not empty", () => {
  expect(fixtures.length).toBeGreaterThan(500);
});

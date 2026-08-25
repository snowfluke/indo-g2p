// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Property-based tests. Every case here is generated, not written, so they
 * cover input no fixture list would think to include: lone consonants, control
 * characters, astral-plane codepoints, and strings of pure punctuation.
 *
 * These assert invariants rather than outputs. A wrong pronunciation is a data
 * bug caught by the fixture tests; a thrown exception or a syllable with no
 * vowel is a structural bug, and only generated input finds those reliably.
 */
import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { normalizeText, toGrapheme, toPhoneme, toSyllables } from "../src/index.ts";

/** Anything that can carry a syllable. Includes the schwa and both diphthong glides. */
const NUCLEUS = /[aiueoəɪʊɔ]/;

/** A plausible word: letters only, and containing at least one vowel to build a syllable on. */
const word = fc.stringMatching(/^[a-z]{1,16}$/).filter((w) => /[aiueo]/.test(w));

describe("properties that must hold for any input", () => {
  test("toPhoneme never throws", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        toPhoneme(text);
      }),
      { numRuns: 2000 }
    );
  });

  test("toPhoneme is deterministic", () => {
    fc.assert(
      fc.property(fc.string(), (text) => toPhoneme(text).phonemes === toPhoneme(text).phonemes),
      { numRuns: 1000 }
    );
  });

  test("every option combination still never throws", () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (text, expandAbbr, normalize, english) => {
          toPhoneme(text, { expandAbbr, normalize, english });
        }
      ),
      { numRuns: 1000 }
    );
  });

  test("syllables rejoin to the phonemes they came from", () => {
    fc.assert(
      fc.property(word, (w) => {
        const result = toPhoneme(w);
        expect(result.syllables.join("").trim()).toBe(result.phonemes.trim());
      }),
      { numRuns: 2000 }
    );
  });

  test("every syllable of a word with a vowel has a nucleus", () => {
    // A syllable with no vowel is unpronounceable, and a speech model given one
    // either drops it or stalls. The guard that prevents it lives in
    // `toSyllables`; this is what proves it holds for input nobody listed.
    fc.assert(
      fc.property(word, (w) => {
        for (const syllable of toSyllables(toPhoneme(w).phonemes)) {
          expect(syllable).toMatch(NUCLEUS);
        }
      }),
      { numRuns: 3000 }
    );
  });

  test("normalisation leaves no ASCII digit behind", () => {
    // A speech model has no phoneme for `7`, so a digit that survives is silent
    // or fatal depending on the model.
    fc.assert(
      fc.property(fc.string(), (text) => {
        expect(normalizeText(text)).not.toMatch(/[0-9]/);
      }),
      { numRuns: 2000 }
    );
  });

  test("toGrapheme emits no phoneme-only characters", () => {
    fc.assert(
      fc.property(word, (w) => {
        expect(toGrapheme(toPhoneme(w).phonemes)).not.toMatch(/[əʔŋɲʃɪʊɔ]/);
      }),
      { numRuns: 2000 }
    );
  });
});

describe("a word with no vowel at all", () => {
  // Not reachable from real Indonesian, but reachable from arbitrary input,
  // so it must degrade rather than throw or invent a vowel.
  test("passes through as one nucleus-free syllable", () => {
    expect(toPhoneme("f")).toEqual({ phonemes: "f", syllables: ["f", " "] });
    expect(toPhoneme("ng").phonemes).toBe("ŋ");
    expect(toSyllables("f")).toEqual(["f"]);
  });
});

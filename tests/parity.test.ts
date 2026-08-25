// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
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

/**
 * The only phoneme outputs allowed to differ from the Python original, keyed
 * by upstream's string.
 *
 * Every one is a word the schwa dictionary does not list, where the affix
 * rules in `src/affix.ts` recover a prefix schwa upstream misses: `seoraŋ`
 * becomes `səoraŋ`, `terbenam` becomes `tərbənam`. Listing them explicitly
 * means a new divergence fails this test instead of slipping through.
 */
const KNOWN_IMPROVEMENTS: ReadonlyMap<string, string> = new Map([
  [
    "taʔ seoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan sewenaŋ-wənaŋ.",
    "taʔ səoraŋ pun boleh ditaŋkap, ditahan ataʊ dibuaŋ dəŋan səwənaŋ-wənaŋ.",
  ],
  [
    "ɲaɲian ʃahdu itu meŋgema di səluruh ruaŋan jaŋ gəlap.",
    "ɲaɲian ʃahdu itu məŋgəma di səluruh ruaŋan jaŋ gəlap.",
  ],
  [
    "pt kaɪ meŋumumkan dʒadwal baru krl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
    "pt kaɪ məŋumumkan dʒadwal baru krl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
  ],
  [
    "pété kaɪ meŋumumkan dʒadwal baru kaèrèl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
    "pété kaɪ məŋumumkan dʒadwal baru kaèrèl dʒabodetabəʔ mulaɪ 1 dʒanuari.",
  ],
  [
    "anaʔ-anaʔ bermain lajaŋ-lajaŋ di pantaɪ kətika matahari terbenam.",
    "anaʔ-anaʔ bərmain lajaŋ-lajaŋ di pantaɪ kətika matahari tərbənam.",
  ],
  [
    'dia mendʒawab, "tidaʔ!" lalu pərgi bəgitu sadʒa.',
    'dia məndʒawab, "tidaʔ!" lalu pərgi bəgitu sadʒa.',
  ],
  [
    "unifərsitas indonesia meɲeleŋgarakan səminar təntaŋ teʔnologi ketʃerdasan buatan.",
    "unifərsitas indonesia məɲeleŋgarakan səminar təntaŋ teʔnologi kətʃərdasan buatan.",
  ],
  ["mempermanènkan", "məmpərmanènkan"],
]);

test("phonemes match the upstream Python implementation on every fixture", () => {
  const mismatches: string[] = [];

  for (const item of fixtures) {
    const { phonemes } = toPhoneme(item.text, { expandAbbr: item.expandAbbr });
    const allowed = KNOWN_IMPROVEMENTS.get(item.phonemes);
    if (phonemes !== item.phonemes && phonemes !== allowed) {
      mismatches.push(`phonemes ${JSON.stringify(item.text)}: ${phonemes} != ${item.phonemes}`);
    }
    // toGrapheme maps ə back to e, so it is unaffected by the schwa recovery.
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

describe("affix schwa recovery", () => {
  test.each([
    ["tersebut", "tərsəbut"],
    ["menjadi", "məndʒadi"],
    ["mengatakan", "məŋatakan"],
    ["beberapa", "bəbərapa"],
    ["kecelakaan", "kətʃəlakaan"],
    ["memperbaiki", "məmpərbaiki"],
  ])("recovers the prefix schwa in %s", (word, expected) => {
    expect(toPhoneme(word).phonemes).toBe(expected);
  });

  test.each([
    // Loanwords that merely start with a prefix's letters. See
    // data/schwa-overrides.tsv, and the onset check in src/affix.ts.
    ["terapi", "terapi"],
    ["teknologi", "teʔnologi"],
    ["metode", "metode"],
    ["serong", "seroŋ"],
  ])("leaves %s alone", (word, expected) => {
    expect(toPhoneme(word).phonemes).toBe(expected);
  });

  test("the curated dictionary always wins over the rules", () => {
    // `sekolah` and `pertama` are listed, and keep exactly their listed reading.
    expect(toPhoneme("sekolah").phonemes).toBe("səkolah");
    expect(toPhoneme("pertama").phonemes).toBe("pərtama");
  });
});

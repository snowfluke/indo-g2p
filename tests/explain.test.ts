// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { explain, toPhoneme } from "../src/index.ts";
import cases from "./fixtures/parity.json" with { type: "json" };

const fixtures: { text: string; expandAbbr: boolean }[] = cases;

describe("explain", () => {
  test("names the layer that answered", () => {
    const bySource = new Map(
      explain("upacara apel jakarta download menurut").map((t) => [t.word, t.source])
    );
    expect(bySource.get("apel")).toBe("collocation");
    expect(bySource.get("download")).toBe("english");
    expect(bySource.get("menurut")).toBe("lexicon");
    // Blocked from English and in no word list, so spelling rules alone.
    expect(bySource.get("jakarta")).toBe("rules");
  });

  test("reports the schwa layers apart", () => {
    const source = (word: string): string => explain(word)[0]?.source ?? "";
    expect(source("mental")).toBe("override");
    expect(source("dengan")).toBe("dictionary");
    // Blocked from the English table but in no schwa list, so spelling rules.
    expect(source("lukman")).toBe("rules");
    // In no word list, but the prefix rules place it.
    expect(source("kewenangannya")).toBe("affix");
    expect(source("menggulirkan")).toBe("affix");
  });

  test("can never disagree with toPhoneme", () => {
    // Every word's reported phonemes must appear in the real transcription.
    const wrong: string[] = [];
    for (const item of fixtures.slice(0, 200)) {
      const { phonemes } = toPhoneme(item.text, { expandAbbr: item.expandAbbr });
      for (const trace of explain(item.text, { expandAbbr: item.expandAbbr })) {
        if (!phonemes.includes(trace.phonemes)) {
          wrong.push(`${trace.word} -> ${trace.phonemes} not in ${phonemes}`);
        }
      }
    }
    expect(wrong.slice(0, 5)).toEqual([]);
  });

  test("follows the same options as toPhoneme", () => {
    expect(explain("5%")[0]?.word).toBe("lima");
    expect(explain("5%", { normalize: false })).toEqual([]);
    expect(explain("event")[0]?.source).toBe("english");
    expect(explain("event", { english: false })[0]?.source).not.toBe("english");
  });

  test("is empty for text with no words", () => {
    expect(explain("!!!")).toEqual([]);
    expect(explain("")).toEqual([]);
  });
});

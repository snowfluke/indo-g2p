// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { collocationRules, resolveCollocations, toPhoneme } from "../src/index.ts";

describe("collocation rules", () => {
  test("are on by default", () => {
    expect(toPhoneme("kami apel di lapangan").phonemes).toBe("kami apel di lapaŋan");
  });

  test("can be switched off", () => {
    expect(toPhoneme("kami apel di lapangan", { resolveSchwa: false }).phonemes).toBe(
      "kami apəl di lapaŋan"
    );
  });

  test.each([
    // A trigger nearby selects the non-default reading.
    ["upacara apel di lapangan sekolah", "apel"],
    ["seluruh pasukan mengikuti apel", "apel"],
    ["per mobil itu patah", "per"],
    ["dia seret kursi itu ke depan", "seret"],
    ["pemain itu pepet lawan di sudut", "pepet"],
  ])("%s fires the rule", (sentence, word) => {
    const words = sentence.split(" ");
    expect(resolveCollocations(words)[words.indexOf(word)]).toBeDefined();
  });

  test.each([
    // No trigger, so the schwa dictionary keeps the word.
    ["dia makan apel merah setiap pagi", "apel"],
    ["harga seratus ribu per orang", "per"],
    ["jalannya seret sekali", "seret"],
    ["vokal pepet dalam bahasa indonesia", "pepet"],
  ])("%s leaves the word alone", (sentence, word) => {
    const words = sentence.split(" ");
    expect(resolveCollocations(words)[words.indexOf(word)]).toBeUndefined();
  });

  test("a trigger outside the window does not reach", () => {
    // Filler must not be number words; those are skipped on purpose below.
    const far = "apel alfa beta gama delta epsilon zeta lapangan".split(" ");
    expect(resolveCollocations(far)[0]).toBeUndefined();
    const near = "apel alfa beta gama lapangan".split(" ");
    expect(resolveCollocations(near)[0]).toBe("apel");
  });

  test("a spelled-out number does not spend the window", () => {
    // `17` normalises to `tujuh belas`, and `12345` to eight words. A number
    // is one thing said in several words, so counting each of them would push
    // the trigger out of reach and silently give the wrong reading.
    expect(toPhoneme("apel 17 agustus di lapangan").phonemes).toBe(
      "apel tudʒuh bəlas agustus di lapaŋan"
    );
    expect(toPhoneme("apel 12345 upacara").phonemes).toContain("apel ");
  });

  test("but a number alone is not a trigger", () => {
    expect(toPhoneme("harga apel 15000 rupiah").phonemes).toContain("apəl");
  });

  test("a word is never its own trigger", () => {
    for (const { word, triggers } of collocationRules()) {
      expect(triggers).not.toContain(word);
    }
  });

  test("every rule changes the reading it applies to", () => {
    // A rule whose output equals the dictionary reading is dead weight.
    for (const { word, triggers } of collocationRules()) {
      const sentence = [word, ...triggers.slice(0, 1)];
      const fired = resolveCollocations(sentence)[0];
      expect(fired).toBeDefined();
      expect(fired).not.toBe(toPhoneme(word, { resolveSchwa: false }).phonemes);
    }
  });
});

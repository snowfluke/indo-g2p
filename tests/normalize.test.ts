// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { normalizeText, spellDecimal, spellNumber, toPhoneme } from "../src/index.ts";

describe("spellNumber", () => {
  test.each([
    [0, "nol"],
    [10, "sepuluh"],
    [11, "sebelas"],
    [12, "dua belas"],
    [21, "dua puluh satu"],
    [100, "seratus"],
    [200, "dua ratus"],
    [1000, "seribu"],
    [1234, "seribu dua ratus tiga puluh empat"],
    [15000, "lima belas ribu"],
    [1000000, "satu juta"],
    [2024, "dua ribu dua puluh empat"],
  ])("%i", (value, expected) => {
    expect(spellNumber(value)).toBe(expected);
  });

  test("reads fractional digits one at a time", () => {
    expect(spellDecimal(3, "14")).toBe("tiga koma satu empat");
  });

  test("leaves a number it cannot spell as digits", () => {
    expect(spellNumber(-1)).toBe("-1");
    expect(spellNumber(1e18)).toBe("1000000000000000000");
  });
});

describe("normalizeText", () => {
  test.each([
    ["harga 15000 rupiah", "harga lima belas ribu rupiah"],
    ["harga Rp250.000", "harga dua ratus lima puluh ribu rupiah"],
    ["naik 5%", "naik lima persen"],
    ["50°C", "lima puluh derajat celsius"],
    ["3+4=7", "tiga plus empat sama dengan tujuh"],
    ["1.234,56", "seribu dua ratus tiga puluh empat koma lima enam"],
  ])("%s", (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });

  test("keeps the punctuation a speech model phrases on", () => {
    expect(normalizeText("Halo, dunia! Benarkah? Ya.")).toBe("Halo, dunia! Benarkah? Ya.");
    expect(normalizeText("(dalam kurung) dan 'kutipan'")).toBe("(dalam kurung) dan 'kutipan'");
  });

  test("folds typographic quotes and dashes onto plain ones", () => {
    expect(normalizeText("«kutipan»")).toBe('"kutipan"');
    expect(normalizeText("Dia — pergi")).toBe("Dia - pergi");
    expect(normalizeText("Ini…")).toBe("Ini...");
  });

  test("drops symbols that have no reading", () => {
    expect(normalizeText("#tagar")).toBe("tagar");
  });

  test("does not guess at times, versions or dates", () => {
    // 1.2.3 is not one number, so it is read part by part rather than as a
    // thousands-grouped figure.
    expect(normalizeText("versi 1.2.3")).toBe("versi satu titik dua titik tiga");
  });

  test("is off by default", () => {
    expect(toPhoneme("naik 5%").phonemes).toBe("naɪʔ 5%");
    expect(toPhoneme("naik 5%", { normalize: true }).phonemes).toBe("naɪʔ lima pərsen");
  });
});

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { toGrapheme, toPhoneme, toSyllables } from "../src/index.ts";

const phonemesOf = (text: string, expandAbbr = false): string =>
  toPhoneme(text, { expandAbbr }).phonemes;

describe("vowel allophones", () => {
  test.each([
    ["serong", "seroŋ"],
    ["sore", "sore"],
    ["kare", "kare"],
    ["teh", "teh"],
    ["tante", "tantə"],
    ["enam", "ənam"],
    ["emas", "əmas"],
    ["toko", "toko"],
    ["sekolah", "səkolah"],
    ["pohon", "pohon"],
    ["gigi", "gigi"],
    ["simpang", "simpaŋ"],
    ["banting", "bantiŋ"],
    ["upah", "upah"],
    ["tunggu", "tuŋgu"],
    ["bundel", "bundəl"],
    ["warung", "waruŋ"],
  ])("%s -> %s", (word, expected) => {
    expect(phonemesOf(word)).toBe(expected);
  });
});

describe("glottal stops", () => {
  test.each([
    ["pek", "peʔ"],
    ["rokok", "rokoʔ"],
    ["pojok", "podʒoʔ"],
    ["momok", "momoʔ"],
    ["periksa", "pəriʔsa"],
    // A `k` before a vowel stays a plain /k/.
    ["kaki", "kaki"],
  ])("%s -> %s", (word, expected) => {
    expect(phonemesOf(word)).toBe(expected);
  });
});

describe("digraphs and diphthongs", () => {
  test.each([
    ["nyanyi", "ɲaɲi"],
    ["syarat", "ʃarat"],
    ["khusus", "xusus"],
    ["cacing", "tʃatʃiŋ"],
    ["taksi", "taʔsi"],
    ["visa", "fisa"],
    ["pulau", "pulaʊ"],
    ["pandai", "pandaɪ"],
    ["amboi", "ambɔɪ"],
  ])("%s -> %s", (word, expected) => {
    expect(phonemesOf(word)).toBe(expected);
  });
});

describe("abbreviations", () => {
  test("are spelled out only when asked", () => {
    expect(phonemesOf("tv")).toBe("tf");
    expect(phonemesOf("tv", true)).toBe("téfé");
  });

  test("leave real words alone", () => {
    expect(phonemesOf("sekolah", true)).toBe("səkolah");
  });
});

describe("non-letter input", () => {
  test.each(["", "   ", "12345", "!!!", "2026-08-22"])("%p passes through", (text) => {
    expect(phonemesOf(text)).toBe(text);
  });

  test("keeps punctuation and casing position", () => {
    expect(phonemesOf("Halo, dunia!")).toBe("halo, dunia!");
  });
});

describe("syllables", () => {
  test("split a word", () => {
    expect(toSyllables("sekolah")).toEqual(["se", "ko", "lah"]);
  });

  test("an empty word yields one empty syllable", () => {
    expect(toSyllables("")).toEqual([""]);
  });

  test("a space closes every word", () => {
    expect(toPhoneme("ini itu").syllables).toEqual(["i", "ni", " ", "i", "tu", " "]);
  });

  test("joined syllables rebuild the phonemes", () => {
    // Each word contributes its syllables plus a closing space, so the join
    // equals the transcription with one extra trailing space.
    const { phonemes, syllables } = toPhoneme("universitas indonesia menyelenggarakan seminar");
    expect(syllables.join("")).toBe(`${phonemes} `);
  });
});

describe("toGrapheme", () => {
  test("undoes the phoneme mapping", () => {
    expect(toGrapheme("ditaŋkap")).toBe("ditangkap");
    expect(toGrapheme("səkolah")).toBe("sekolah");
    expect(toGrapheme("ambɔɪ")).toBe("amboi");
  });

  test("cannot recover information the mapping drops", () => {
    // Both /ə/ and /e/ spell as `e`, and a glottal stop always spells as `k`.
    expect(toGrapheme(phonemesOf("bebek"))).toBe("bebek");
  });
});

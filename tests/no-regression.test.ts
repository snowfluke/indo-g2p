// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { toPhoneme } from "../src/index.ts";
import { knownHomographs, resolveHomographs } from "../src/homographs.ts";
import { homographTable, resolveFromTags } from "../src/homograph-table.ts";
import { POS_GROUPS } from "../src/data/pos-model.ts";
import { applySchwa } from "../src/schwa.ts";
import { tagWords } from "../src/pos/tagger.ts";

const FRAMES: ((word: string) => string[])[] = [
  (w) => [w],
  (w) => ["orang", "itu", "sangat", w, "sekali"],
  (w) => ["mereka", "akan", w, "barang", "itu", "besok"],
  (w) => ["saya", "membeli", w, "baru", "di", "pasar"],
  (w) => ["dia", "tinggal", "di", "kota", w],
];

describe("the resolver never guesses", () => {
  test("only overrides the dictionary when the tag matches one of the entry's two classes", () => {
    const violations: string[] = [];

    for (const word of knownHomographs()) {
      const entry = homographTable().get(word);
      if (!entry) continue;

      for (const frame of FRAMES) {
        const words = frame(word);
        const index = words.indexOf(word);
        const tag = tagWords(words)[index] ?? "";
        const resolved = resolveHomographs(words)[index];

        const hasEvidence =
          (POS_GROUPS[entry.first]?.includes(tag) ?? false) ||
          (POS_GROUPS[entry.second]?.includes(tag) ?? false);

        // No evidence must mean no opinion, so the dictionary keeps the word.
        if (!hasEvidence && resolved !== undefined) {
          violations.push(`${word} tagged ${tag} but resolver returned ${resolved}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("an unrelated tag leaves the word to the dictionary", () => {
    // B-SYM is in no coarse class, so neither reading can be selected.
    expect(resolveFromTags(["pening"], ["B-SYM"])).toEqual([undefined]);
    expect(resolveFromTags(["pening"], ["B-PPO"])).toEqual([undefined]);
  });

  test("an unverified side always falls through to the dictionary", () => {
    // `seret` is only verified as a verb; adjective evidence must not guess.
    expect(resolveFromTags(["seret"], ["B-VBT"])).toEqual(["seret"]);
    expect(resolveFromTags(["seret"], ["B-ADJ"])).toEqual([undefined]);
  });

  test("verified evidence resolves both ways", () => {
    // Wiktionary: terapi (noun, therapy) vs têrapi (adjective, tidiest).
    expect(resolveFromTags(["terapi"], ["B-NNO"])).toEqual(["terapi"]);
    expect(resolveFromTags(["terapi"], ["B-ADJ"])).toEqual(["tərapi"]);
  });

  test("a side dropped as unsafe never fires", () => {
    // pening's noun sense is real but archaic, and the tagger reads the
    // common adjective as a noun, so only the adjective side is kept.
    expect(resolveFromTags(["pening"], ["B-ADJ"])).toEqual(["pəning"]);
    expect(resolveFromTags(["pening"], ["B-NNO"])).toEqual([undefined]);
  });

  test("drops words Wiktionary shows as having one pronunciation", () => {
    // Both senses of `ganteng` are gantêng, so no POS rule can apply.
    expect(knownHomographs()).not.toContain("ganteng");
    expect(resolveFromTags(["ganteng"], ["B-ADJ"])).toEqual([undefined]);
  });

  test("keeps the dictionary reading of ganteng in real sentences", () => {
    for (const sentence of [
      "orang itu ganteng sekali",
      "dia sangat ganteng dan ramah",
      "pemuda ganteng itu tersenyum",
    ]) {
      expect(toPhoneme(sentence, { resolveSchwa: resolveHomographs }).phonemes).toBe(
        toPhoneme(sentence).phonemes
      );
    }
  });

  test("every resolved word is one of the entry's two readings", () => {
    for (const word of knownHomographs()) {
      const dictionary = applySchwa(word);
      for (const frame of FRAMES) {
        const words = frame(word);
        const resolved = resolveHomographs(words)[words.indexOf(word)];
        if (resolved === undefined) continue;
        // A reading only ever differs from the plain word by e -> ə.
        expect(resolved.replaceAll("ə", "e")).toBe(dictionary.replaceAll("ə", "e"));
      }
    }
  });
});

/**
 * The common sense of every verified homograph, in a natural sentence.
 * The schwa dictionary already spells the common reading, so the resolver
 * must not change any of these. A rule that breaks one is a regression in
 * ordinary text and belongs in data/homographs-verified.tsv as `-`.
 */
const COMMON_SENSE: [string, string][] = [
  ["apel", "dia makan apel merah setiap pagi"],
  ["apel", "harga apel di pasar naik"],
  ["ketel", "air dalam ketel itu mendidih"],
  ["letak", "letak rumah itu sangat strategis"],
  ["letak", "saya lupa letak kunci mobil"],
  ["leter", "huruf leter itu besar"],
  ["pening", "kepala saya pening sekali"],
  ["pening", "dia merasa pening setelah bangun"],
  ["pepet", "vokal pepet dalam bahasa indonesia"],
  ["per", "per mobil itu patah"],
  ["per", "harga seratus ribu per orang"],
  ["rebak", "luka itu rebak dan dalam"],
  ["rembes", "matanya rembes karena sakit"],
  ["seret", "dia seret kursi itu ke depan"],
  ["terapi", "dia menjalani terapi fisik"],
  ["terapi", "terapi ini sangat membantu"],
];

describe("verified rules never corrupt ordinary text", () => {
  // Compared against the schwa dictionary alone. The default resolver is the
  // collocation rules, which are allowed to change these, and are covered by
  // tests/collocations.test.ts.
  test.each(COMMON_SENSE)("%s: %s", (_word, sentence) => {
    expect(toPhoneme(sentence, { resolveSchwa: resolveHomographs }).phonemes).toBe(
      toPhoneme(sentence, { resolveSchwa: false }).phonemes
    );
  });

  test("every verified word still resolves the sense it was kept for", () => {
    // paling + terapi is the superlative of `rapi`, not the noun `therapy`.
    expect(toPhoneme("kamar itu paling terapi", { resolveSchwa: resolveHomographs }).phonemes).toBe(
      "kamar itu paliŋ tərapi"
    );
  });
});

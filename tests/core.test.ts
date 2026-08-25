// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import { toPhoneme as core } from "../src/core.ts";
import { toPhoneme as full } from "../src/index.ts";
import cases from "./fixtures/parity.json" with { type: "json" };

const fixtures: { text: string; expandAbbr: boolean }[] = cases;

describe("indo-g2p/core", () => {
  test("differs from the main entry only on English words", () => {
    const differing = fixtures.filter(
      (item) =>
        core(item.text, { expandAbbr: item.expandAbbr }).phonemes !==
        full(item.text, { expandAbbr: item.expandAbbr, english: false }).phonemes
    );
    expect(differing).toEqual([]);
  });

  test("reads English by Indonesian rules", () => {
    expect(core("event").phonemes).toBe("efent");
    expect(full("event").phonemes).toBe("ifent");
  });

  test("keeps everything else", () => {
    expect(core("Menurut pemerintah, harga naik 15%").phonemes).toBe(
      "mənurut pəmərintah, harga naɪʔ lima bəlas pərsen"
    );
    expect(core("upacara apel di lapangan").phonemes).toBe("upatʃara apel di lapaŋan");
    expect(core("tersebut").phonemes).toBe("tərsəbut");
  });

  test("does not reach the English table", async () => {
    // The point of the entry point: nothing it imports pulls the table in.
    const seen = new Set<string>();
    const walk = async (specifier: string): Promise<void> => {
      if (seen.has(specifier)) return;
      seen.add(specifier);
      const source = await Bun.file(specifier).text();
      for (const match of source.matchAll(/from "(\.[^"]+)"/g)) {
        const next = new URL(match[1] ?? "", `file://${specifier}`).pathname;
        await walk(next);
      }
    };
    await walk(`${import.meta.dir}/../src/core.ts`);
    expect(
      [...seen].filter((f) => f.endsWith("english.ts") || f.endsWith("data/english.ts"))
    ).toEqual([]);
  });
});

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { describe, expect, test } from "bun:test";
import * as core from "../src/core.ts";
import * as full from "../src/index.ts";
import cases from "./fixtures/parity.json" with { type: "json" };

const fixtures: { text: string; expandAbbr: boolean }[] = cases;

describe("indo-g2p/core", () => {
  test("differs from the main entry only on English words", () => {
    const differing = fixtures.filter(
      (item) =>
        core.toPhoneme(item.text, { expandAbbr: item.expandAbbr }).phonemes !==
        full.toPhoneme(item.text, { expandAbbr: item.expandAbbr, english: false }).phonemes
    );
    expect(differing).toEqual([]);
  });

  test("reads English by Indonesian rules", () => {
    expect(core.toPhoneme("event").phonemes).toBe("efent");
    expect(full.toPhoneme("event").phonemes).toBe("ifent");
  });

  test("keeps everything else", () => {
    expect(core.toPhoneme("Menurut pemerintah, harga naik 15%").phonemes).toBe(
      "mənurut pəmərintah, harga naɪʔ lima bəlas pərsen"
    );
    expect(core.toPhoneme("upacara apel di lapangan").phonemes).toBe("upatʃara apel di lapaŋan");
    expect(core.toPhoneme("tersebut").phonemes).toBe("tərsəbut");
  });

  test("exports everything the main entry does, bar the English table itself", () => {
    const missing = Object.keys(full).filter((name) => !(name in core));
    expect(missing).toEqual(["englishWords", "lookUpEnglish"]);
  });

  test("explain reports the source it actually used", () => {
    expect(core.explain("event")[0]?.source).toBe("rules");
    expect(full.explain("event")[0]?.source).toBe("english");
    // The reported source must follow the option, not the table.
    expect(full.explain("event", { english: false })[0]?.source).toBe("rules");
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

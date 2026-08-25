// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/// <reference types="bun-types" />

/**
 * Regenerate docs/homograph-review.md from the curated table.
 *
 *     bun scripts/gen-homograph-doc.ts
 */
import { resolve } from "node:path";

import { POS_GROUPS } from "../src/data/pos-model.ts";
import { homographTable } from "../src/homograph-table.ts";
import { knownHomographs } from "../src/homographs.ts";
import { applySchwa } from "../src/schwa.ts";

const ROOT = resolve(import.meta.dir, "..");
const NAME: Record<string, string> = {
  N: "noun",
  V: "verb",
  A: "adjective",
  P: "particle/prep",
};

/** Rewrite the `e`s selected by `bits` as `ə`. */
function reading(word: string, bits: number): string {
  let seen = 0;
  return [...word]
    .map((char) => {
      if (char !== "e") return char;
      const isSchwa = (bits >> seen) & 1;
      seen++;
      return isSchwa ? "ə" : char;
    })
    .join("");
}

const evidence = new Map<string, string>();
for (const line of (await Bun.file(`${ROOT}/data/homographs-verified.tsv`).text()).split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const cells = line.split("\t");
  evidence.set(cells[0] ?? "", cells[5] ?? "");
}

const rows = knownHomographs()
  .map((word) => {
    const entry = homographTable().get(word);
    if (!entry) return "";
    const side = (cls: string, bits: number): string =>
      POS_GROUPS[cls] ? `${NAME[cls]} to \`${reading(word, bits)}\`` : "abstains";
    return (
      `| \`${word}\` | ${side(entry.first, entry.forFirst)} ` +
      `| ${side(entry.second, entry.forSecond)} ` +
      `| \`${applySchwa(word)}\` | ${evidence.get(word)} |`
    );
  })
  .filter(Boolean);

const doc = `# Homograph review

Some Indonesian words are spelled alike but read differently, and the
difference is which \`e\` is a schwa. \`apel\` is \`/apəl/\` as the fruit and
\`/apel/\` as a military roll call.

\`indo-g2p/homographs\` resolves a word only when its part-of-speech tag matches
a reading verified against the Indonesian entry on
[en.wiktionary.org](https://en.wiktionary.org), which marks the pepet vowel
explicitly: \`ê\` is \`/ə/\`, while \`é\` and \`è\` are not. Everything else is left
to the schwa dictionary.

## What survived

Bookbot's upstream table has 102 entries. 45 are unusable, because both
readings share a part of speech or the readings are identical. Of the
remaining 57:

| Outcome | Count | Why |
| --- | --- | --- |
| Rule kept | ${rows.length} | Wiktionary marks two readings that split by part of speech |
| One pronunciation | 3 | \`ganteng\`, \`relai\` and \`semi\` are marked the same in every sense, so no rule can apply |
| No marked evidence | 43 | Wiktionary has no pepet-marked Indonesian entry, so nothing can be checked |

The dictionary already spells \`ganteng\` as \`gantəng\`, \`relai\` as \`rəlai\` and
\`semi\` as \`səmi\`, matching Wiktionary. Dropping those rules made the output
more correct, not less.

## The kept rules

"abstains" marks a side that could not be verified, or was verified but proved
unsafe. That side always falls through to the schwa dictionary.

| word | class A | class B | dictionary | evidence |
| --- | --- | --- | --- | --- |
${rows.join("\n")}

## Why a verified rule can still be dropped

\`pening\` is a real homograph: \`pêning\` (adjective, dizzy) against \`pening\`
(noun, a tax plate). The noun is archaic, and the tagger labels the common
adjective as a noun, so the rule fired the wrong way on ordinary sentences like
*kepala saya pening sekali*. Its noun side is dropped for that reason, not for
lack of evidence.

\`tests/no-regression.test.ts\` holds a sentence for the common sense of every
kept word and asserts the resolver leaves it alone. Add a rule to
\`data/homographs-verified.tsv\` and that test decides whether it may ship.

## Editing the table

\`data/homographs-verified.tsv\` is the source of truth:

\`\`\`bash
python3 scripts/dump-pos.py .        # regenerates src/data/homographs.ts
bun scripts/gen-homograph-doc.ts     # regenerates this file
bun test
\`\`\`
`;

await Bun.write(`${ROOT}/docs/homograph-review.md`, doc);
console.log(`wrote docs/homograph-review.md with ${rows.length} rules`);

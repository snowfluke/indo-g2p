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

/**
 * Verdict counts printed by `python3 scripts/verify-homographs.py`, which
 * re-runs the whole audit against Wiktionary. Update both together.
 */
const AUDIT = { confirmed: 5, half: 6, single: 16, contradicted: 3, unverified: 27 };
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
readings share a part of speech or the readings are identical. Reproduce the
verdicts on the remaining 57 with:

\`\`\`bash
python3 scripts/verify-homographs.py <path-to>/homographs_id.tsv
\`\`\`

| Verdict | Count | Meaning |
| --- | --- | --- |
| \`confirmed\` | ${AUDIT.confirmed} | both classes match a marked Wiktionary reading; the rule ships both ways |
| \`half\` | ${AUDIT.half} | one class matches; only that side ships |
| \`single\` | ${AUDIT.single} | every marked sense reads the same, so no part-of-speech rule can apply |
| \`contradicted\` | ${AUDIT.contradicted} | the marked readings do not split along these classes |
| \`unverified\` | ${AUDIT.unverified} | no pepet-marked Indonesian entry exists to check against |

That leaves ${rows.length} rules shipping and ${AUDIT.single + AUDIT.contradicted + AUDIT.unverified} dropped.

The \`single\` group matters more than its name suggests. \`ganteng\`, \`relai\` and
\`semi\` are marked identically in every sense with nothing left unmarked, so
their upstream rules were simply wrong. The dictionary already spells them
\`gantəng\`, \`rəlai\` and \`səmi\`, matching Wiktionary, so dropping those rules
made the output more correct rather than less.

### Why the other sources do not help

KBBI, the official dictionary, splits homographs into numbered entries but
publishes no pronunciation field at all, so it cannot say which \`e\` is a
schwa. That leaves Wiktionary as the only machine-checkable source, and the
\`unverified\` group is the set of words it has never marked.

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

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/// <reference types="bun-types" />

/**
 * Regenerate the coverage matrix in README.md by running every example.
 *
 *     bun scripts/gen-coverage.ts
 *
 * The table is generated rather than written by hand because hand-written
 * examples go stale silently: three of them were wrong in the README before
 * a review caught it. Anything in this file is what the library actually did
 * the last time the script ran, and CI fails if the two drift apart.
 */
import { resolve } from "node:path";

import { toPhoneme } from "../src/index.ts";

/** One row: what the library handles, and an input that shows it. */
type Case = { covers: string; input: string; note?: string };

const GROUPS: { title: string; cases: Case[] }[] = [
  {
    title: "Words",
    cases: [
      { covers: "Ordinary vocabulary", input: "sekolah" },
      { covers: "Schwa from the dictionary", input: "dengan" },
      { covers: "Schwa in a derived word", input: "tersebut", note: "not in any word list" },
      { covers: "Schwa through a prefix", input: "memperbaiki" },
      { covers: "Passive prefix", input: "digelar" },
      { covers: "Syllables", input: "cerdas", note: "see the syllables column" },
    ],
  },
  {
    title: "Sounds",
    cases: [
      { covers: "Digraphs", input: "nyanyi syarat khusus" },
      { covers: "Affricates", input: "cacing jajan" },
      { covers: "Diphthongs", input: "pulau pandai amboi" },
      { covers: "Glottal stop", input: "rusak bakso rakyat" },
      { covers: "`kh` is not a glottal stop", input: "akhir" },
      { covers: "`kr` and `kl` are not either", input: "demokrat iklan" },
    ],
  },
  {
    title: "Ambiguity",
    cases: [
      { covers: "Homograph, by context", input: "upacara apel di lapangan" },
      { covers: "The same word, other sense", input: "dia makan apel merah" },
      { covers: "Homograph with a number between", input: "apel 17 agustus di lapangan" },
      { covers: "Abbreviation, opt in", input: "tv", note: "`expandAbbr: true`" },
    ],
  },
  {
    title: "Numbers and symbols",
    cases: [
      { covers: "Integer", input: "15000" },
      { covers: "Indonesian digit grouping", input: "1.234,56" },
      { covers: "Currency", input: "Rp250.000" },
      { covers: "Percentage", input: "naik 5%" },
      { covers: "Degrees", input: "50°C" },
      { covers: "Arithmetic", input: "3+4=7" },
      {
        covers: "Version, not a number",
        input: "versi 1.2.3",
        note: "deliberately not read as one",
      },
      { covers: "Date, not interpreted", input: "1 April 2024", note: "no date parsing" },
    ],
  },
  {
    title: "Foreign words",
    cases: [
      { covers: "English word", input: "download" },
      { covers: "English brand", input: "iphone" },
      { covers: "Western name", input: "michael" },
      { covers: "Name Indonesian rules mangle", input: "denny", note: "was `dennj`" },
      { covers: "Indonesian place name", input: "jakarta", note: "kept Indonesian" },
      { covers: "Indonesian personal name", input: "lukman", note: "kept Indonesian" },
      { covers: "Month name", input: "april", note: "kept Indonesian" },
    ],
  },
  {
    title: "Text",
    cases: [
      { covers: "Punctuation is kept", input: "Halo, dunia! Benarkah?" },
      { covers: "Typographic quotes folded", input: "«kutipan»" },
      { covers: "Unreadable symbols dropped", input: "#tagar" },
      { covers: "Case is folded", input: "Jakarta" },
      { covers: "Non-letters pass through", input: "email@situs.com" },
    ],
  },
];

const escape = (text: string): string => text.replaceAll("|", "\\|");

/**
 * Pad a table's columns to an even width.
 *
 * The checked-in README is padded, and CI fails the build when this file's
 * output differs from it, so the padding has to happen here rather than in a
 * formatter. Nothing formats markdown in this repo.
 */
function table(header: string[], body: string[][]): string {
  const all = [header, ...body];
  const widths = header.map((_, column) =>
    Math.max(...all.map((row) => [...(row[column] ?? "")].length))
  );
  // Counted in code points, so a phoneme like `ʃ` costs one column, not two.
  const line = (cells: string[]): string =>
    `| ${cells.map((cell, i) => cell + " ".repeat((widths[i] ?? 0) - [...cell].length)).join(" | ")} |`;
  return [line(header), line(widths.map((width) => "-".repeat(width))), ...body.map(line)].join(
    "\n"
  );
}

const rows = GROUPS.map(({ title, cases }) => {
  const body = cases.map((item) => {
    const expand = item.note?.includes("expandAbbr") ?? false;
    const { phonemes } = toPhoneme(item.input, expand ? { expandAbbr: true } : {});
    const note = item.note ? ` <sub>${item.note}</sub>` : "";
    return [`${item.covers}${note}`, `\`${escape(item.input)}\``, `\`${escape(phonemes)}\``];
  });
  return `### ${title}\n\n${table(["Covers", "Input", "Output"], body)}`;
}).join("\n\n");

const syllables = ["cerdas", "sekolah", "memperbaiki", "beautiful"]
  .map(
    (w) =>
      `\`${w}\` → \`${toPhoneme(w)
        .syllables.filter((s) => s !== " ")
        .join(" · ")}\``
  )
  .join(", ");

const section = `## What it covers

Every row below is generated by running the input through \`toPhoneme\` with
default options, so it cannot drift from what the library does. Regenerate with
\`bun run coverage\`.

${rows}

Syllables come back alongside the phonemes: ${syllables}.
`;

const path = resolve(import.meta.dir, "..", "README.md");
const readme = await Bun.file(path).text();
const start = readme.indexOf("## What it covers");
const end = readme.indexOf("\n## ", start + 1);
const updated =
  start === -1
    ? readme.replace("\n## API", `\n${section}\n## API`)
    : // The extra newline restores the blank line before the next heading,
      // which `end` consumed. Without it the check-in and the generator drift
      // by one line and CI fails the coverage gate.
      `${readme.slice(0, start)}${section}\n${readme.slice(end + 1)}`;

await Bun.write(path, updated);
console.log(`coverage matrix: ${GROUPS.reduce((n, g) => n + g.cases.length, 0)} rows`);

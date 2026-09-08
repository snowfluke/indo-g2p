// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/**
 * Pad a table's columns to an even width.
 *
 * The checked-in README and docs are padded, and CI fails the build when a
 * generator's output differs from them, so the padding has to happen here
 * rather than in a formatter. Nothing formats markdown in this repo.
 */
export function table(header: string[], body: string[][]): string {
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

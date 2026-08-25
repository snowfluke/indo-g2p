// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

const ONES: readonly string[] = [
  "nol",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

/** Powers of a thousand, from the smallest up. */
const SCALES: readonly (readonly [number, string])[] = [
  [1_000_000_000_000, "triliun"],
  [1_000_000_000, "miliar"],
  [1_000_000, "juta"],
  [1_000, "ribu"],
];

/** Indonesian numbers larger than this are not spelled out. */
const LIMIT = 1_000_000_000_000_000;

/**
 * Every word {@linkcode spellNumber} can produce.
 *
 * A spelled-out number is one thing said in many words, so anything measuring
 * distance between words has to be able to skip it.
 */
export const NUMBER_WORDS: ReadonlySet<string> = new Set([
  ...ONES,
  "sepuluh",
  "sebelas",
  "belas",
  "puluh",
  "seratus",
  "ratus",
  "seribu",
  "ribu",
  "juta",
  "miliar",
  "triliun",
  "koma",
]);

/**
 * Spell a whole number below one thousand.
 *
 * Indonesian uses `se-` rather than `satu` for a single ten or hundred, so
 * eleven is `sebelas` and one hundred is `seratus`.
 */
function underThousand(value: number): string {
  if (value < 10) return ONES[value] ?? "";
  if (value < 20) {
    if (value === 10) return "sepuluh";
    if (value === 11) return "sebelas";
    return `${ONES[value - 10]} belas`;
  }
  if (value < 100) {
    const tens = `${ONES[Math.floor(value / 10)]} puluh`;
    const rest = value % 10;
    return rest === 0 ? tens : `${tens} ${ONES[rest]}`;
  }

  const hundreds = value < 200 ? "seratus" : `${ONES[Math.floor(value / 100)]} ratus`;
  const rest = value % 100;
  return rest === 0 ? hundreds : `${hundreds} ${underThousand(rest)}`;
}

/**
 * Spell a whole number in Indonesian.
 *
 * @param value A non-negative integer below one quadrillion.
 * @returns The number in words, or the digits unchanged if it is out of range.
 *
 * @example
 * ```ts
 * spellNumber(15000); // "lima belas ribu"
 * ```
 */
export function spellNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value >= LIMIT) return String(value);
  if (value < 1000) return underThousand(value);

  for (const [scale, name] of SCALES) {
    if (value < scale) continue;
    const count = Math.floor(value / scale);
    // One thousand is `seribu`, but one million is `satu juta`.
    const head = count === 1 && scale === 1000 ? "seribu" : `${spellNumber(count)} ${name}`;
    const rest = value % scale;
    return rest === 0 ? head : `${head} ${spellNumber(rest)}`;
  }

  return String(value);
}

/**
 * Spell a decimal, reading the fractional digits one at a time.
 *
 * @param whole The part before the separator.
 * @param fraction The digits after it, as written.
 * @returns The number in words.
 *
 * @example
 * ```ts
 * spellDecimal(3, "14"); // "tiga koma satu empat"
 * ```
 */
export function spellDecimal(whole: number, fraction: string): string {
  const digits = [...fraction].map((d) => ONES[Number(d)] ?? d).join(" ");
  return `${spellNumber(whole)} koma ${digits}`;
}

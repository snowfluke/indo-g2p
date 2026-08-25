// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { spellDecimal, spellNumber } from "./number.ts";

/**
 * Punctuation a speech model uses for phrasing, and which is left alone.
 * Everything else that is not a letter or a digit is either spoken or dropped.
 */
const KEPT_PUNCTUATION = ".,!?;:'\"()-";

/** Typographic characters folded onto the plain ones a model is trained on. */
const TYPOGRAPHY: readonly (readonly [RegExp, string])[] = [
  [/[‘’‛]/g, "'"],
  [/[“”„«»]/g, '"'],
  [/[–—―]/g, "-"],
  [/…/g, "..."],
  [/ /g, " "],
];

/** Symbols read aloud as Indonesian words. */
const SPOKEN_SYMBOLS: readonly (readonly [RegExp, string])[] = [
  [/%/g, " persen"],
  [/&/g, " dan "],
  [/@/g, " at "],
  [/°\s*c\b/gi, " derajat celsius"],
  [/°/g, " derajat"],
  [/\+/g, " plus "],
  [/=/g, " sama dengan "],
  [/\//g, " garis miring "],
  [/[$€£]/g, " dolar "],
];

/** `Rp5.000` and `Rp 5.000` both mean five thousand rupiah. */
const RUPIAH = /\brp\s*([\d.,]*\d)/gi;

/** A number written with `.` for thousands and `,` for the decimal. */
const NUMBER = /\d[\d.]*(?:,\d+)?/g;

/** Read one written number, honouring Indonesian digit grouping. */
function readNumber(text: string): string {
  const [whole = "", fraction] = text.split(",");
  const digits = whole.replaceAll(".", "");
  // A dotted group that is not a thousands separator, such as a version or an
  // IP address, is read digit by digit instead of as one huge number.
  const grouped = /^\d{1,3}(\.\d{3})*$/.test(whole) || !whole.includes(".");
  if (!grouped)
    return whole
      .split(".")
      .map((part) => spellNumber(Number(part)))
      .join(" titik ");

  const value = Number(digits);
  if (!Number.isSafeInteger(value)) return text;
  return fraction === undefined ? spellNumber(value) : spellDecimal(value, fraction);
}

/**
 * Rewrite text so a speech model sees only words and phrasing punctuation.
 *
 * Digits, currency, percentages and symbols have no phoneme of their own, so
 * a model trained on IPA either drops them or fails. This spells them out in
 * Indonesian and folds typographic quotes and dashes onto the plain ones,
 * while leaving `.,!?;:'"()-` in place because those carry the phrasing.
 *
 * Times and dates are deliberately not interpreted: `07.30` could be a time,
 * a version or a price, and guessing wrong is worse than reading the digits.
 *
 * @param text The text to normalise.
 * @returns The text with everything unspeakable rewritten as words.
 *
 * @example
 * ```ts
 * normalizeText("harga Rp15.000 naik 5%");
 * // "harga lima belas ribu rupiah naik lima persen"
 * ```
 */
export function normalizeText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of TYPOGRAPHY) result = result.replace(pattern, replacement);

  result = result.replace(RUPIAH, (_all, amount: string) => `${readNumber(amount)} rupiah`);
  for (const [pattern, replacement] of SPOKEN_SYMBOLS) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(NUMBER, readNumber);

  // Anything still unspeakable is dropped rather than passed to the model.
  const allowed = new Set(KEPT_PUNCTUATION);
  result = [...result].filter((char) => /[\p{Letter}\s]/u.test(char) || allowed.has(char)).join("");

  // Substitutions insert their own spacing, so runs are collapsed. Leading
  // and trailing space is left alone; trimming is the caller's business.
  return result.replace(/\s+/g, " ");
}

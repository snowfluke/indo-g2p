// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import type { SchwaResolver } from "../src/index.ts";
import { toGrapheme, toPhoneme } from "../src/index.ts";

const SAMPLES = [
  "Tak seorang pun boleh ditangkap, ditahan atau dibuang dengan sewenang-wenang.",
  "Saya pergi ke sekolah naik sepeda motor pada pukul enam pagi.",
  "Nyanyian syahdu itu menggema di seluruh ruangan yang gelap.",
  "Setiap senin kami apel di lapangan.",
  "Anak-anak bermain layang-layang di pantai.",
  "PT KAI mengumumkan jadwal baru KRL Jabodetabek.",
];

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`missing #${id}`);
  return node as T;
};

const input = el<HTMLTextAreaElement>("input");
const expandAbbr = el<HTMLInputElement>("expandAbbr");
const homographs = el<HTMLInputElement>("homographs");
const phonemesOut = el<HTMLOutputElement>("phonemes");
const syllablesOut = el<HTMLOutputElement>("syllables");
const graphemeOut = el<HTMLOutputElement>("grapheme");
const timing = el<HTMLParagraphElement>("timing");

// The tagger is 3.3 MB, so it is only fetched if the box is ticked.
let resolver: SchwaResolver | undefined;

async function loadResolver(): Promise<void> {
  if (resolver) return;
  timing.textContent = "loading tagger...";
  const module = await import("../src/homographs.ts");
  resolver = module.resolveHomographs;
}

function render(): void {
  const started = performance.now();
  const { phonemes, syllables } = toPhoneme(input.value, {
    expandAbbr: expandAbbr.checked,
    resolveSchwa: homographs.checked ? resolver : undefined,
  });
  const elapsed = performance.now() - started;

  phonemesOut.textContent = phonemes;
  graphemeOut.textContent = toGrapheme(phonemes);

  syllablesOut.replaceChildren(
    ...syllables.map((syllable) => {
      const chip = document.createElement("span");
      if (syllable === " ") chip.className = "gap";
      else chip.textContent = syllable;
      return chip;
    })
  );

  const words = input.value.match(/[a-z]+/gi)?.length ?? 0;
  timing.textContent = `${words} words in ${elapsed.toFixed(2)} ms`;
}

input.addEventListener("input", render);
expandAbbr.addEventListener("change", render);
homographs.addEventListener("change", async () => {
  if (homographs.checked) await loadResolver();
  render();
});

const samples = el<HTMLDivElement>("samples");
for (const sample of SAMPLES) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = sample.length > 34 ? `${sample.slice(0, 34)}...` : sample;
  button.title = sample;
  button.addEventListener("click", () => {
    input.value = sample;
    render();
  });
  samples.append(button);
}

render();

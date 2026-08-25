/// <reference types="bun-types" />
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { resolve } from "node:path";

/**
 * Bump the version in every place it is written, then open a CHANGELOG entry.
 *
 *     bun scripts/bump.ts patch|minor|major|<x.y.z>
 *
 * package.json, jsr.json and src/version.ts must agree; the pre-commit hook
 * rejects the commit if the two manifests drift apart.
 */
const root = resolve(import.meta.dir, "..");
const bump = Bun.argv[2];

const SEMVER = /^\d+\.\d+\.\d+$/;
const LEVELS = ["major", "minor", "patch"] as const;

type Level = (typeof LEVELS)[number];

function isLevel(value: string | undefined): value is Level {
  return LEVELS.some((level) => level === value);
}

function next(current: string, level: Level): string {
  const parts = current.split(".").map(Number);
  const index = LEVELS.indexOf(level);
  return parts
    .map((part, i) => {
      if (i < index) return part;
      return i === index ? part + 1 : 0;
    })
    .join(".");
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return await Bun.file(resolve(root, path)).json();
}

async function writeVersion(path: string, version: string): Promise<void> {
  const file = resolve(root, path);
  const text = await Bun.file(file).text();
  await Bun.write(file, text.replace(/"version": "[^"]*"/, `"version": "${version}"`));
}

const pkg = await readJson("package.json");
const current = typeof pkg["version"] === "string" ? pkg["version"] : "0.0.0";

if (!bump || (!isLevel(bump) && !SEMVER.test(bump))) {
  console.error(`Usage: bun scripts/bump.ts ${LEVELS.join("|")}|<x.y.z>   (current ${current})`);
  process.exit(1);
}

const version = isLevel(bump) ? next(current, bump) : bump;

await writeVersion("package.json", version);
await writeVersion("jsr.json", version);
await Bun.write(
  resolve(root, "src/version.ts"),
  (await Bun.file(resolve(root, "src/version.ts")).text()).replace(
    /VERSION: string = "[^"]*"/,
    `VERSION: string = "${version}"`
  )
);

const changelogPath = resolve(root, "CHANGELOG.md");
const changelog = await Bun.file(changelogPath).text();
const today = new Date().toISOString().slice(0, 10);
await Bun.write(
  changelogPath,
  changelog.replace("## [Unreleased]", `## [Unreleased]\n\n## [${version}] - ${today}`)
);

console.log(`${current} -> ${version}`);
console.log("Next: fill in the CHANGELOG entry, commit, then tag and release.");

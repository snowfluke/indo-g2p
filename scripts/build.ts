/// <reference types="bun-types" />
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

// One tsc pass emits both the JavaScript and the declarations, rewriting the
// `.ts` import specifiers (which JSR requires) to `.js` for npm consumers.
const root = resolve(import.meta.dir, "..");
const outDir = resolve(root, "lib");

if (existsSync(outDir)) rmSync(outDir, { recursive: true });

const tsc = Bun.spawnSync(["bunx", "tsc", "-p", resolve(root, "tsconfig.build.json")], {
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
});

process.exit(tsc.exitCode ?? 1);

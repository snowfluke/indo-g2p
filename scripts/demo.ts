// SPDX-License-Identifier: MIT
// Copyright (c) 2026 snowfluke

/// <reference types="bun-types" />

/**
 * Serve the demo page at http://localhost:3000.
 *
 *     bun run demo
 *
 * Bun's HTML import bundles demo.ts and style.css on the fly, so there is no
 * build step and no bundler config.
 */
import index from "../demo/index.html";

const server = Bun.serve({
  routes: { "/": index },
  development: { hmr: true, console: true },
});

console.log(`demo running at ${server.url}`);

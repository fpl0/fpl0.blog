/**
 * Playwright global setup: build with drafts included, start preview server.
 * No source files are modified — INCLUDE_DRAFTS env var tells content.ts
 * to include draft entries during the build.
 */

import { type ChildProcess, execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, "..");
const PORT = 4321;
const BASE_URL = `http://localhost:${PORT}`;

/** Kill any process occupying the preview port. */
function freePort(): void {
  try {
    const pids = execSync(`lsof -ti :${PORT}`, { encoding: "utf-8" }).trim();
    if (pids) {
      execSync(`kill ${pids}`, { stdio: "ignore" });
      // Brief wait for port release
      execSync("sleep 0.5");
    }
  } catch {
    // No process on port — nothing to do
  }
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} not ready after ${timeoutMs}ms`);
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  // Ensure port is free (leftover from a previous crashed run)
  freePort();

  // Build the site with drafts included
  execSync("bun run build", {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, INCLUDE_DRAFTS: "true" },
  });

  // Start the Astro preview server
  const server: ChildProcess = spawn("bun", ["run", "preview"], {
    cwd: ROOT,
    stdio: "pipe",
  });

  await waitForServer(BASE_URL, 30_000);

  return () => {
    server.kill();
    // Also kill by port in case the child process tree wasn't cleaned up
    freePort();
  };
}

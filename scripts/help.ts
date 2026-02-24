/**
 * Central help command listing all available 0:* commands.
 *
 * Usage:
 *   bun run 0:help
 */

import { bold, cyan, dim } from "./fmt";

const commands = [
  { name: "0:new-post", desc: "Scaffold a new blog post" },
  { name: "0:new-app", desc: "Scaffold a new app" },
  { name: "0:list", desc: "List all content entries" },
  { name: "0:publish", desc: "Publish a draft entry" },
  { name: "0:unpublish", desc: "Revert a published entry to draft" },
  { name: "0:delete", desc: "Permanently delete a content entry" },
  { name: "0:help", desc: "Show this help" },
];

const nameW = Math.max(...commands.map((c) => c.name.length));

console.log("");
console.log(`  ${bold("Content Management Commands")}`);
console.log("");

for (const c of commands) {
  const padded = c.name.padEnd(nameW);
  console.log(`    ${cyan(padded)}  ${dim(c.desc)}`);
}

console.log("");
console.log(dim("  Run any command with --help for details."));
console.log("");

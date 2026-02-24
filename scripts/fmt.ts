/**
 * Minimal ANSI color and formatting utilities for CLI scripts.
 * Respects the NO_COLOR convention (https://no-color.org/).
 */

const enabled = !process.env.NO_COLOR;

function wrap(code: string, text: string): string {
  return enabled ? `\x1b[${code}m${text}\x1b[0m` : text;
}

// -- Style modifiers ----------------------------------------------------------

export function bold(text: string): string {
  return wrap("1", text);
}

export function dim(text: string): string {
  return wrap("2", text);
}

// -- Semantic colors ----------------------------------------------------------

export function green(text: string): string {
  return wrap("32", text);
}

export function red(text: string): string {
  return wrap("31", text);
}

export function yellow(text: string): string {
  return wrap("33", text);
}

export function cyan(text: string): string {
  return wrap("36", text);
}

// -- Semantic output helpers --------------------------------------------------

export function success(msg: string): void {
  console.log(`  ${green("v")} ${msg}`);
}

export function error(msg: string): void {
  console.error(`  ${red("x")} ${msg}`);
}

export function warn(msg: string): void {
  console.error(`  ${yellow("!")} ${msg}`);
}

export function info(msg: string): void {
  console.log(`  ${cyan("*")} ${msg}`);
}

export function step(msg: string): void {
  console.log(`  ${dim(">")} ${msg}`);
}

export function heading(text: string): void {
  console.log(`\n${bold(text)}\n`);
}

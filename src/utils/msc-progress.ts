/**
 * MSc progress helpers — single source of truth for "how far along am I?"
 * logic that both the full dashboard (`apps/msc-cogsci/App.astro`) and any
 * lightweight summary (`components/NowPanel.astro`) need.
 *
 * Data source: `src/data/msc-curriculum.ts`. This module encapsulates the
 * "must be in completedWeeks AND artifact.link must be set" rule so the two
 * surfaces can't drift apart.
 */

import {
  artifactWeeks,
  completedWeeks,
  inProgressWeek,
  type Module,
  programme,
  type Semester,
  semesters,
  type Week,
} from "../data/msc-curriculum";

const completedSet = new Set(completedWeeks);

// Precomputed O(1) lookup tables built once at module load — the curriculum
// is static, so a Map beats a linear scan-per-week across 5×~4×N structures.
const weekByNumber = new Map<number, Week>();
const contextByWeek = new Map<number, { semester: Semester; module: Module }>();
for (const s of semesters) {
  for (const m of s.modules) {
    for (const w of m.weekDetails) weekByNumber.set(w.n, w);
    for (let n = m.weeks[0]; n <= m.weeks[1]; n++) {
      contextByWeek.set(n, { semester: s, module: m });
    }
  }
}

export function weekById(n: number): Week | undefined {
  return weekByNumber.get(n);
}

export function moduleForWeek(n: number): { semester: Semester; module: Module } | null {
  return contextByWeek.get(n) ?? null;
}

/**
 * A week counts as done only when it's in `completedWeeks` AND, if it carries
 * an artifact, the artifact has a `link` set. Enforces "ship the work, then
 * mark it done."
 */
export function isWeekDone(n: number): boolean {
  if (!completedSet.has(n)) return false;
  const wk = weekByNumber.get(n);
  if (wk?.artifact && !wk.artifact.link) return false;
  return true;
}

/** Week is marked complete but the artifact hasn't been linked yet. */
export function awaitsLink(n: number): boolean {
  if (!completedSet.has(n)) return false;
  const wk = weekByNumber.get(n);
  return !!wk?.artifact && !wk.artifact.link;
}

export interface ProgressSnapshot {
  weeksDone: number;
  weeksTotal: number;
  artifactsDone: number;
  artifactsTotal: number;
  percentComplete: number;
  currentWeek: number | null;
  currentWeekTitle: string | null;
  currentModuleCode: string | null;
  currentModuleTitle: string | null;
  currentSemesterN: number | null;
}

let cachedSnapshot: ProgressSnapshot | null = null;

/** One-call progress summary. Memoised — curriculum data is static. */
export function getProgressSnapshot(): ProgressSnapshot {
  if (cachedSnapshot) return cachedSnapshot;

  let weeksDone = 0;
  for (let n = 1; n <= programme.totalWeeks; n++) {
    if (isWeekDone(n)) weeksDone++;
  }
  const artifactsDone = artifactWeeks.filter(isWeekDone).length;
  const percentComplete = Math.round((weeksDone / programme.totalWeeks) * 100);

  const wk = inProgressWeek !== null ? (weekByNumber.get(inProgressWeek) ?? null) : null;
  const ctx = inProgressWeek !== null ? (contextByWeek.get(inProgressWeek) ?? null) : null;

  cachedSnapshot = {
    weeksDone,
    weeksTotal: programme.totalWeeks,
    artifactsDone,
    artifactsTotal: programme.totalArtifacts,
    percentComplete,
    currentWeek: inProgressWeek,
    currentWeekTitle: wk?.title ?? null,
    currentModuleCode: ctx?.module.code ?? null,
    currentModuleTitle: ctx?.module.title ?? null,
    currentSemesterN: ctx?.semester.n ?? null,
  };
  return cachedSnapshot;
}

export type TickState = "done" | "current" | "awaits" | "upcoming";
export type RailState = "shipped" | "next" | "future" | "current";

export interface SemesterTicks {
  n: Semester["n"];
  count: number;
  weeks: { n: number; state: TickState }[];
}

function tickState(n: number): TickState {
  if (isWeekDone(n)) return "done";
  if (n === inProgressWeek) return "current";
  if (awaitsLink(n)) return "awaits";
  return "upcoming";
}

const nextUnshippedArtifact = artifactWeeks.find((n) => !isWeekDone(n) && n !== inProgressWeek);

export function railState(n: number): RailState | null {
  if (!artifactWeeks.includes(n)) return null;
  if (isWeekDone(n)) return "shipped";
  if (n === inProgressWeek) return "current";
  if (n === nextUnshippedArtifact) return "next";
  return "future";
}

export const TICK_SUFFIX: Record<TickState, string> = {
  done: " · completed",
  current: " · in progress",
  awaits: " · awaiting link",
  upcoming: "",
};

export const RAIL_SUFFIX: Record<RailState, string> = {
  shipped: " · shipped",
  current: " · in progress",
  next: " · next up",
  future: "",
};

/** Zero-pad a week number to two digits (e.g. 7 → "07"). */
export const pad2 = (n: number) => String(n).padStart(2, "0");

let cachedSemesterTicks: SemesterTicks[] | null = null;

/** Per-semester arrays of ticks for the NowPanel + dashboard heatmap strips. */
export function buildSemesterTicks(): SemesterTicks[] {
  if (cachedSemesterTicks) return cachedSemesterTicks;
  cachedSemesterTicks = semesters.map((s) => {
    const [start, end] = s.weeks;
    const count = end - start + 1;
    const weeks = Array.from({ length: count }, (_, i) => ({
      n: start + i,
      state: tickState(start + i),
    }));
    return { n: s.n, count, weeks };
  });
  return cachedSemesterTicks;
}

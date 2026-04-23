/**
 * Generate / refresh the Obsidian vault that is the working "brain" for
 * the Self-Directed MSc in Cognitive Science curriculum.
 *
 * Source of truth: `src/data/msc-curriculum.ts`.
 *
 * Usage:
 *   bun run scripts/generate-msc-vault.ts                  # skip existing files
 *   bun run scripts/generate-msc-vault.ts --force          # overwrite everything
 *   VAULT_PATH=/some/path bun run scripts/generate-msc-vault.ts
 *
 * The default vault path is the iCloud-synced Obsidian vault
 * `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/fpl0-msc-cogsci`.
 *
 * What this writes:
 *   Home.md, Milestones.md
 *   Semesters/            S1–S5 MOCs
 *   Modules/              21 module notes
 *   Weeks/                80 week notes (one per week, with readings as checkboxes)
 *   Library/              reading room — Books, Papers, Courses, Files (attachments),
 *                         Artifacts (21 trackers), Assignments
 *   Notes/                empty Zettelkasten index
 *   _Templates/           templates for new Paper/Book/Concept notes
 *
 * Rerun with --force after editing the curriculum to regenerate MOCs
 * without touching your personal notes (skip-if-exists is the default).
 */

import { existsSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import {
  artifactWeeks,
  completedWeeks,
  type ItemKind,
  type Module,
  milestones,
  programme,
  type Semester,
  semesters,
  type Week,
  type WeekItem,
} from "../src/data/msc-curriculum";
import { dim, heading, info, success, warn } from "./fmt";

// ---------------------------------------------------------------- config

const DEFAULT_VAULT = join(
  homedir(),
  "Library/Mobile Documents/iCloud~md~obsidian/Documents/fpl0-msc-cogsci",
);
const VAULT = process.env.VAULT_PATH || DEFAULT_VAULT;
const FORCE = process.argv.includes("--force");

// ---------------------------------------------------------------- helpers

/** Sanitize a title so it's a safe filename on macOS/Obsidian. */
function safe(s: string): string {
  return s
    .replace(/[/\\:*?"<>|#^[\]]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Trim an artifact's long title to the portion before the first " — ". */
function shortArtifactTitle(t: string): string {
  const idx = t.indexOf(" — ");
  return (idx >= 0 ? t.slice(0, idx) : t).trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function weekFilename(w: Week): string {
  return `W${pad2(w.n)} — ${safe(w.title)}.md`;
}
function weekLinkBase(w: Week): string {
  return weekFilename(w).replace(/\.md$/, "");
}

// Assignment filename matches what `generate-assignment` writes. The live file
// is `Library/Assignments/W{NN} — {title} — Assignment.md`; bare wikilinks
// resolve by basename in Obsidian, so we only need the base.
function assignmentFilenameBase(w: Week): string {
  return `W${pad2(w.n)} — ${safe(w.title)} — Assignment`;
}

function moduleFilename(m: Module): string {
  return `${m.code} — ${safe(m.title)}.md`;
}
function moduleLinkBase(m: Module): string {
  return moduleFilename(m).replace(/\.md$/, "");
}

function semesterFilename(s: Semester): string {
  return `S${s.n} — ${safe(s.title)}.md`;
}
function semesterLinkBase(s: Semester): string {
  return semesterFilename(s).replace(/\.md$/, "");
}

function artifactNumberFor(weekN: number): number {
  const idx = artifactWeeks.indexOf(weekN);
  if (idx < 0) throw new Error(`week ${weekN} has no artifact`);
  return idx + 1;
}

function artifactFilename(weekN: number, artifactTitle: string): string {
  const n = artifactNumberFor(weekN);
  return `A${pad2(n)} — ${safe(shortArtifactTitle(artifactTitle))}.md`;
}
function artifactLinkBase(weekN: number, artifactTitle: string): string {
  return artifactFilename(weekN, artifactTitle).replace(/\.md$/, "");
}

const kindLabel: Record<ItemKind, string> = {
  read: "Read",
  watch: "Watch",
  paper: "Paper",
  code: "Code",
  write: "Write",
  activity: "Do",
  note: "Note",
};

// ---------------------------------------------------------------- books

// Curated bibliography. The curriculum data lists books as free-text `read`
// items inside weeks; this registry pulls them into structured entries so we
// can emit one note per book with back-links to the weeks that use it.
//
// When the curriculum changes, update this list — the generator is the only
// place that knows about books as first-class objects.
interface BookEntry {
  authors: string; // display string, matches curriculum prose
  title: string;
  moduleCode: string; // primary module where introduced
  weeks: number[]; // all weeks that assign this book
  note?: string; // optional extra context
  /** Alternative prefixes used in the curriculum text (e.g. "Bear et al."). */
  matchAliases?: string[];
}

const BOOKS: BookEntry[] = [
  // S1 Foundations
  { authors: "Bermúdez", title: "Cognitive Science", moduleCode: "1.1", weeks: [1, 2, 3] },
  {
    authors: "Dawson",
    title: "Mind, Body, World",
    moduleCode: "1.1",
    weeks: [2],
    note: "skim for a second perspective",
  },
  { authors: "Kim", title: "Philosophy of Mind", moduleCode: "1.2", weeks: [4, 5, 6] },
  {
    authors: "Gazzaniga, Ivry & Mangun",
    title: "Cognitive Neuroscience",
    moduleCode: "1.3",
    weeks: [8, 9, 13],
  },
  {
    authors: "Bear, Connors & Paradiso",
    title: "Neuroscience: Exploring the Brain",
    moduleCode: "1.4",
    weeks: [11, 12, 13],
    matchAliases: ["Bear et al."],
  },
  { authors: "Churchland", title: "Neurophilosophy", moduleCode: "1.4", weeks: [13] },
  {
    authors: "Huettel, Song & McCarthy",
    title: "Functional Magnetic Resonance Imaging",
    moduleCode: "1.4",
    weeks: [14],
  },
  {
    authors: "Luck",
    title: "An Introduction to the ERP Technique",
    moduleCode: "1.4",
    weeks: [14],
  },
  { authors: "Hari & Puce", title: "MEG-EEG Primer", moduleCode: "1.4", weeks: [14], note: "skim" },
  { authors: "McElreath", title: "Statistical Rethinking", moduleCode: "1.5", weeks: [16, 17] },
  // S2 Computational Core
  {
    authors: "Farrell & Lewandowsky",
    title: "Computational Modeling of Cognition and Behavior",
    moduleCode: "2.1",
    weeks: [18, 19, 20],
  },
  { authors: "Marr", title: "Vision", moduleCode: "2.1", weeks: [18] },
  {
    authors: "Griffiths, Chater & Tenenbaum",
    title: "Bayesian Models of Cognition",
    moduleCode: "2.2",
    weeks: [22, 23, 24],
  },
  {
    authors: "Lee & Wagenmakers",
    title: "Bayesian Cognitive Modeling",
    moduleCode: "2.2",
    weeks: [23],
  },
  {
    authors: "O'Reilly & Munakata",
    title: "Computational Cognitive Neuroscience",
    moduleCode: "2.3",
    weeks: [26, 27, 28],
    note: "free online textbook",
  },
  {
    authors: "Rumelhart & McClelland",
    title: "Parallel Distributed Processing, Vol. 1",
    moduleCode: "2.3",
    weeks: [27],
    matchAliases: ["PDP Vol 1"],
  },
  {
    authors: "Dayan & Abbott",
    title: "Theoretical Neuroscience",
    moduleCode: "2.4",
    weeks: [30, 31, 32],
  },
  // S3 Brain, Behaviour, and Development
  {
    authors: "Eichenbaum",
    title: "The Cognitive Neuroscience of Memory",
    moduleCode: "3.1",
    weeks: [34, 35],
  },
  { authors: "Buzsáki", title: "Rhythms of the Brain", moduleCode: "3.1", weeks: [35] },
  {
    authors: "Sutton & Barto",
    title: "Reinforcement Learning: An Introduction",
    moduleCode: "3.2",
    weeks: [37, 38, 39],
  },
  { authors: "Gershman", title: "What Makes Us Smart", moduleCode: "3.2", weeks: [39] },
  {
    authors: "Piaget",
    title: "The Construction of Reality in the Child",
    moduleCode: "3.3",
    weeks: [41],
  },
  { authors: "Vygotsky", title: "Mind in Society", moduleCode: "3.3", weeks: [41] },
  { authors: "Spelke", title: "What Babies Know", moduleCode: "3.3", weeks: [41] },
  { authors: "Carey", title: "The Origin of Concepts", moduleCode: "3.3", weeks: [42] },
  {
    authors: "de Waal",
    title: "Are We Smart Enough to Know How Smart Animals Are?",
    moduleCode: "3.3",
    weeks: [43],
  },
  { authors: "Jackendoff", title: "Foundations of Language", moduleCode: "3.4", weeks: [45] },
  { authors: "Bergen", title: "Louder than Words", moduleCode: "3.4", weeks: [46] },
  { authors: "Lakoff & Johnson", title: "Metaphors We Live By", moduleCode: "3.4", weeks: [46] },
  // S4 Embodied & Phenomenological Turn
  {
    authors: "Varela, Thompson & Rosch",
    title: "The Embodied Mind",
    moduleCode: "4.1",
    weeks: [48],
  },
  { authors: "Clark", title: "Being There", moduleCode: "4.1", weeks: [49] },
  { authors: "Thompson", title: "Mind in Life", moduleCode: "4.1", weeks: [50] },
  {
    authors: "Gallagher & Zahavi",
    title: "The Phenomenological Mind",
    moduleCode: "4.2",
    weeks: [52, 53],
  },
  {
    authors: "Merleau-Ponty",
    title: "Phenomenology of Perception",
    moduleCode: "4.2",
    weeks: [52],
  },
  { authors: "Noë", title: "Action in Perception", moduleCode: "4.2", weeks: [52] },
  { authors: "Dreyfus", title: "What Computers Still Can't Do", moduleCode: "4.2", weeks: [53] },
  {
    authors: "Gallagher",
    title: "How the Body Shapes the Mind",
    moduleCode: "4.2",
    weeks: [53],
    note: "optional",
  },
  { authors: "Chalmers", title: "The Conscious Mind", moduleCode: "4.3", weeks: [55] },
  {
    authors: "Baars",
    title: "A Cognitive Theory of Consciousness",
    moduleCode: "4.3",
    weeks: [56],
  },
  { authors: "Dehaene", title: "Consciousness and the Brain", moduleCode: "4.3", weeks: [56] },
  { authors: "Koch", title: "The Feeling of Life Itself", moduleCode: "4.3", weeks: [57] },
  { authors: "Dennett", title: "Consciousness Explained", moduleCode: "4.3", weeks: [57] },
  { authors: "Hohwy", title: "The Predictive Mind", moduleCode: "4.3", weeks: [57, 59] },
  { authors: "Clark", title: "Surfing Uncertainty", moduleCode: "4.4", weeks: [59, 60] },
  // S5 Integration & Capstone
  { authors: "Newell", title: "Unified Theories of Cognition", moduleCode: "5.2", weeks: [65] },
  {
    authors: "Anderson",
    title: "How Can the Human Mind Occur in the Physical Universe?",
    moduleCode: "5.2",
    weeks: [65],
  },
  { authors: "Clark", title: "Supersizing the Mind", moduleCode: "5.2", weeks: [66] },
  { authors: "Port & van Gelder", title: "Mind as Motion", moduleCode: "5.3", weeks: [68, 69] },
  { authors: "Kelso", title: "Dynamic Patterns", moduleCode: "5.3", weeks: [68] },
  { authors: "Hutchins", title: "Cognition in the Wild", moduleCode: "5.3", weeks: [69] },
];

function bookBaseName(b: BookEntry): string {
  return `${b.authors} — ${b.title}`;
}
function bookFilename(b: BookEntry): string {
  return `${safe(bookBaseName(b))}.md`;
}
function bookLinkBase(b: BookEntry): string {
  return safe(bookBaseName(b));
}

// ---------------------------------------------------------------- courses

interface CourseEntry {
  /** Short label used as the wikilink alias inside week notes. */
  label: string;
  /** Full, descriptive title for the note itself. */
  title: string;
  provider: string;
  instructor?: string;
  moduleCode: string;
  weeks: number[];
  url?: string;
  /** Alternative prefixes used in the curriculum text (e.g. "MIT 9.13"). */
  matchAliases?: string[];
}

const COURSES: CourseEntry[] = [
  {
    label: "Berkeley COGSCI 1",
    title: "Berkeley COGSCI 1 — Introduction to Cognitive Science",
    provider: "UC Berkeley",
    moduleCode: "1.1",
    weeks: [1, 2, 3],
  },
  {
    label: 'Edinburgh Coursera "Philosophy of Cognitive Sciences"',
    title: "Edinburgh — Philosophy of Cognitive Sciences (Coursera)",
    provider: "University of Edinburgh · Coursera",
    moduleCode: "1.2",
    weeks: [4, 5, 6],
    matchAliases: ["Coursera"],
  },
  {
    label: "MIT 9.13 The Human Brain",
    title: "MIT 9.13 — The Human Brain",
    provider: "MIT",
    instructor: "Nancy Kanwisher",
    moduleCode: "1.4",
    weeks: [11, 12, 13, 14],
    matchAliases: ["MIT 9.13"],
  },
  {
    label: "MIT Brains, Minds, Machines",
    title: "MIT Brains, Minds, Machines — Summer Course",
    provider: "MIT CBMM",
    moduleCode: "2.1",
    weeks: [18, 19],
  },
  {
    label: "MIT OCW 9.66J",
    title: "MIT OCW 9.66J — Computational Cognitive Science",
    provider: "MIT OpenCourseWare",
    moduleCode: "2.1",
    weeks: [20],
  },
  {
    label: "McElreath — Statistical Rethinking lectures",
    title: "Statistical Rethinking — McElreath YouTube Lectures",
    provider: "YouTube",
    instructor: "Richard McElreath",
    moduleCode: "1.5",
    weeks: [16],
  },
  {
    label: "Coursera Computational Neuroscience (UW)",
    title: "Computational Neuroscience — University of Washington (Coursera)",
    provider: "University of Washington · Coursera",
    moduleCode: "2.4",
    weeks: [30, 31, 32],
    matchAliases: ["Coursera"],
  },
  {
    label: "MIT BCS Computational Tutorial Series",
    title: "MIT BCS Computational Tutorial Series",
    provider: "MIT",
    moduleCode: "2.4",
    weeks: [32],
  },
];

function courseFilename(c: CourseEntry): string {
  return `${safe(c.title)}.md`;
}
function courseLinkBase(c: CourseEntry): string {
  return safe(c.title);
}

function findCourseForWatchItem(
  text: string,
  weekN: number,
): { course: CourseEntry; matched: string; adverb: string } | null {
  const adverbMatch = text.match(ADVERBIAL_PREFIX);
  const adverb = adverbMatch ? adverbMatch[0] : "";
  const body = text.slice(adverb.length);

  const candidates = COURSES.flatMap((c) => {
    const prefixes = [c.label, ...(c.matchAliases ?? [])];
    const matched = prefixes.find((p) => body.startsWith(p));
    return matched ? [{ course: c, matched, adverb }] : [];
  });
  if (candidates.length === 0) return null;
  const byWeek = candidates.find((c) => c.course.weeks.includes(weekN));
  if (byWeek) return byWeek;
  return [...candidates].sort((a, b) => b.matched.length - a.matched.length)[0] ?? null;
}

function linkCourseInWatchText(text: string, weekN: number): string {
  const m = findCourseForWatchItem(text, weekN);
  if (!m) return text;
  const body = text.slice(m.adverb.length);
  return `${m.adverb}${link(courseLinkBase(m.course), m.matched)}${body.slice(m.matched.length)}`;
}

// ---------------------------------------------------------------- papers

interface ParsedPaper {
  /** "Author(s) (Year)" — used as the unique key and filename prefix. */
  authorYear: string;
  title: string; // may be empty when curriculum omitted it
  weeks: number[];
  moduleCode: string; // primary module of first appearance
  firstRawText: string; // for reference in the stub
}

/**
 * Split a raw `paper` item's text into one or more papers. The curriculum
 * joins adjacent papers with ` · `. Each chunk is expected to match
 * `Author(s) (Year) — Title` or `Author(s) (Year)` (title omitted).
 */
function splitPaperItem(text: string): { authorYear: string; title: string }[] {
  const chunks = text.split(/\s+·\s+/);
  const out: { authorYear: string; title: string }[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^(.+?\(\d{4}[a-z]?\))\s*(?:—\s*(.+))?$/);
    if (m?.[1]) {
      out.push({ authorYear: m[1].trim(), title: (m[2] ?? "").trim() });
    } else {
      // Unparseable — keep as a single opaque entry so we don't drop it.
      out.push({ authorYear: chunk.trim(), title: "" });
    }
  }
  return out;
}

function paperBaseName(p: { authorYear: string; title: string }): string {
  return p.title ? `${p.authorYear} — ${p.title}` : p.authorYear;
}

function paperLinkBase(p: { authorYear: string; title: string }): string {
  return safe(paperBaseName(p));
}

/** Discover every paper across the curriculum, deduped by `authorYear`. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: inline fallback parsing for ad-hoc paper entries
function discoverPapers(): ParsedPaper[] {
  const byKey = new Map<string, ParsedPaper>();
  for (const fw of flatWeeks) {
    for (const it of fw.week.items) {
      if (it.kind !== "paper") continue;
      for (const p of splitPaperItem(it.text)) {
        const existing = byKey.get(p.authorYear);
        if (existing) {
          if (!existing.weeks.includes(fw.week.n)) existing.weeks.push(fw.week.n);
          if (!existing.title && p.title) existing.title = p.title;
        } else {
          byKey.set(p.authorYear, {
            authorYear: p.authorYear,
            title: p.title,
            weeks: [fw.week.n],
            moduleCode: fw.module.code,
            firstRawText: it.text,
          });
        }
      }
    }
  }
  return [...byKey.values()].sort((a, b) => {
    const minA = Math.min(...a.weeks);
    const minB = Math.min(...b.weeks);
    return minA - minB;
  });
}

/**
 * Render a `paper` list item. Multi-paper joined items become multiple
 * checkboxes, each linked to its own stub.
 */
function renderPaperItem(text: string): string {
  const papers = splitPaperItem(text);
  return papers
    .map((p) => `- [ ] **Paper** — ${link(paperLinkBase(p), paperBaseName(p))}`)
    .join("\n");
}

// ---------------------------------------------------------------- index

// Flatten weeks with their module/semester context for lookups.
interface FlatWeek {
  week: Week;
  module: Module;
  semester: Semester;
}

const flatWeeks: FlatWeek[] = [];
for (const s of semesters) {
  for (const m of s.modules) {
    for (const w of m.weekDetails) {
      flatWeeks.push({ week: w, module: m, semester: s });
    }
  }
}

function weekById(n: number): FlatWeek | undefined {
  return flatWeeks.find((fw) => fw.week.n === n);
}

// ---------------------------------------------------------------- writer

let wrote = 0;
let skipped = 0;

async function ensureDir(p: string): Promise<void> {
  await mkdir(p, { recursive: true });
}

async function write(relPath: string, content: string): Promise<void> {
  const full = join(VAULT, relPath);
  await ensureDir(dirname(full));
  if (!FORCE && existsSync(full)) {
    skipped++;
    console.log(`  ${dim("·")} skip  ${relPath}`);
    return;
  }
  await writeFile(full, content, "utf8");
  wrote++;
  console.log(`  ${dim("+")} wrote ${relPath}`);
}

async function copy(srcAbs: string, destRel: string): Promise<void> {
  const full = join(VAULT, destRel);
  await ensureDir(dirname(full));
  if (!existsSync(srcAbs)) {
    warn(`source missing, not copied: ${srcAbs}`);
    return;
  }
  if (!FORCE && existsSync(full)) {
    skipped++;
    console.log(`  ${dim("·")} skip  ${destRel}`);
    return;
  }
  await copyFile(srcAbs, full);
  wrote++;
  console.log(`  ${dim("+")} copy  ${destRel}`);
}

// ---------------------------------------------------------------- renderers

function fm(
  fields: Record<string, string | number | boolean | Array<string | number> | null>,
): string {
  const lines: string[] = ["---"];
  for (const [k, v] of Object.entries(fields)) {
    if (v === null) continue;
    if (Array.isArray(v)) {
      const items = v.map((x) => (typeof x === "number" ? String(x) : JSON.stringify(x)));
      lines.push(`${k}: [${items.join(", ")}]`);
    } else if (typeof v === "string") {
      // Always quote string values — safest across YAML parsers (commas,
      // tag-like starts, etc. can all trip plain scalars).
      lines.push(`${k}: ${JSON.stringify(v)}`);
    } else {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}

/** `[[target|alias]]` — or just `[[target]]` when alias is redundant. */
function link(target: string, alias?: string): string {
  if (!alias || alias === target) return `[[${target}]]`;
  return `[[${target}|${alias}]]`;
}

const ADVERBIAL_PREFIX = /^(Skim:|Optional:|Browse:)\s+/i;

/**
 * Find the BOOK whose authors (or a matchAlias) prefix the `read` item's
 * text. Strips leading "Skim:", "Optional:", or "Browse:" first. When several
 * books share a prefix (Andy Clark authors three of them), prefer the one
 * whose `weeks` list contains the current week.
 *
 * Returns which exact prefix matched so the caller can splice the wikilink in
 * at the right boundary without over- or under-cutting.
 */
function findBookForReadItem(
  text: string,
  weekN: number,
): { book: BookEntry; matched: string; adverb: string } | null {
  const adverbMatch = text.match(ADVERBIAL_PREFIX);
  const adverb = adverbMatch ? adverbMatch[0] : "";
  const body = text.slice(adverb.length);

  const candidates = BOOKS.flatMap((b) => {
    const prefixes = [b.authors, ...(b.matchAliases ?? [])];
    const matched = prefixes.find((p) => body.startsWith(p));
    return matched ? [{ book: b, matched, adverb }] : [];
  });
  if (candidates.length === 0) return null;
  const byWeek = candidates.find((c) => c.book.weeks.includes(weekN));
  if (byWeek) return byWeek;
  return [...candidates].sort((a, b) => b.matched.length - a.matched.length)[0] ?? null;
}

function linkBookInReadText(text: string, weekN: number): string {
  const m = findBookForReadItem(text, weekN);
  if (!m) return text;
  const body = text.slice(m.adverb.length);
  return `${m.adverb}${link(bookLinkBase(m.book), m.matched)}${body.slice(m.matched.length)}`;
}

function renderItem(it: WeekItem, weekN: number): string {
  if (it.kind === "paper") return renderPaperItem(it.text);
  if (it.kind === "read") {
    return `- [ ] **Read** — ${linkBookInReadText(it.text, weekN)}`;
  }
  if (it.kind === "watch") {
    return `- [ ] **Watch** — ${linkCourseInWatchText(it.text, weekN)}`;
  }
  return `- [ ] **${kindLabel[it.kind]}** — ${it.text}`;
}

// ---- Week note -------------------------------------------------------------

function renderWeek(fw: FlatWeek): string {
  const { week, module: mod, semester } = fw;
  const hasArtifact = !!week.artifact;
  const aNum = hasArtifact ? artifactNumberFor(week.n) : null;

  const header = fm({
    type: "week",
    week: week.n,
    module: mod.code,
    semester: semester.n,
    title: week.title,
    hours: week.hours ?? "",
    "artifact-week": hasArtifact,
    status: "not-started",
    started: "",
    finished: "",
  });

  const metaLine = [
    `> **Module ${link(moduleLinkBase(mod), `${mod.code} — ${mod.title}`)}**`,
    `· **Semester ${link(semesterLinkBase(semester), `S${semester.n} ${semester.shortTitle}`)}**`,
    week.hours ? `· **${week.hours} hrs**` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const assignmentLink = `[[${assignmentFilenameBase(week)}\\|W${pad2(week.n)} Assignment]]`;
  const assessItem = `- [ ] **Assess** — ${assignmentLink}`;

  const itemsWithAssess =
    week.items.length > 0
      ? [...week.items.map((it) => renderItem(it, week.n)), assessItem].join("\n")
      : assessItem;

  const art = week.artifact;
  const artifactBlock =
    hasArtifact && art && aNum != null
      ? [
          "",
          "## Artifact",
          "",
          `- **${link(artifactLinkBase(week.n, art.title), `A${pad2(aNum)} — ${shortArtifactTitle(art.title)}`)}**`,
          `- Kind: ${art.kind}`,
          `- Length: ${art.length}`,
        ].join("\n")
      : "";

  return [
    header,
    `# W${pad2(week.n)} — ${week.title}`,
    "",
    metaLine,
    "",
    "## Readings & activities",
    "",
    itemsWithAssess,
    artifactBlock,
    "",
    "## Notes",
    "",
    "_What I learned, questions that came up, connections to other weeks._",
    "",
    "## Reflection",
    "",
    "_At end of week: what stuck, what confused me, what I'd do differently._",
    "",
  ].join("\n");
}

// ---- Module note -----------------------------------------------------------

function renderModule(mod: Module, semester: Semester): string {
  const weekLinks = mod.weekDetails.map((w) => `- ${link(weekLinkBase(w))}`).join("\n");

  const assignmentLinks = mod.weekDetails
    .map((w) => `- [[${assignmentFilenameBase(w)}\\|W${pad2(w.n)} Assignment]] — ${w.title}`)
    .join("\n");

  const artifactWeek = mod.weekDetails.find((w) => w.artifact);
  const artifactLine = artifactWeek?.artifact
    ? `- ${link(artifactLinkBase(artifactWeek.n, artifactWeek.artifact.title))} · due W${pad2(artifactWeek.n)}`
    : "_No artifact._";

  const header = fm({
    type: "module",
    module: mod.code,
    semester: semester.n,
    weeks: [mod.weeks[0], mod.weeks[1]],
    title: mod.title,
    status: "not-started",
  });

  return [
    header,
    `# ${mod.code} — ${mod.title}`,
    "",
    `> **Semester ${link(semesterLinkBase(semester), `S${semester.n} — ${semester.title}`)}** · Weeks ${mod.weeks[0]}–${mod.weeks[1]}`,
    "",
    "## Guiding question",
    "",
    `> ${mod.question}`,
    "",
    "## Weeks",
    "",
    weekLinks,
    "",
    "## Assessments",
    "",
    assignmentLinks,
    "",
    "## Artifact",
    "",
    artifactLine,
    "",
    "## Module-level notes",
    "",
    "_Cross-week synthesis, recurring themes, what changed my mind._",
    "",
  ].join("\n");
}

// ---- Artifact note ---------------------------------------------------------

function renderArtifact(fw: FlatWeek): string {
  const { week, module: mod, semester } = fw;
  if (!week.artifact) throw new Error("renderArtifact on non-artifact week");
  const a = week.artifact;
  const n = artifactNumberFor(week.n);

  const header = fm({
    type: "artifact",
    artifact: n,
    week: week.n,
    module: mod.code,
    semester: semester.n,
    title: a.title,
    kind: a.kind,
    length: a.length,
    status: "not-started",
    link: "",
    shipped: "",
    grade: "",
  });

  return [
    header,
    `# A${pad2(n)} — ${shortArtifactTitle(a.title)}`,
    "",
    `> **Week ${link(weekLinkBase(week))}** · **Module ${link(moduleLinkBase(mod))}** · **Semester ${link(semesterLinkBase(semester))}**`,
    "",
    "## At a glance",
    "",
    `- **Title** — ${a.title}`,
    `- **Kind** — ${a.kind}`,
    `- **Length** — ${a.length}`,
    "- **Status** — not-started",
    "- **Published link** — _(fill in once shipped)_",
    "",
    "## Brief",
    "",
    "_Restate what this artifact needs to do in your own words._",
    "",
    "## Outline",
    "",
    "## Draft",
    "",
    "## Sources",
    "",
    "## Ship checklist",
    "",
    "- [ ] Draft complete",
    "- [ ] Self-review pass",
    "- [ ] Peer/AI review pass",
    "- [ ] Published",
    "- [ ] `completedWeeks` updated in `src/data/msc-curriculum.ts`",
    "- [ ] `artifact.link` set and committed",
    "",
    "## Grade",
    "",
    "_Self-assessed /100 once shipped — scope, clarity, rigour, brief fulfilled. `ship-artifact` writes the entry as `**Grade: <n>/100 · <date>** — <rationale>`. Append fresh entries if you re-grade later; don't overwrite._",
    "",
    "## Post-mortem",
    "",
    "_What worked, what I'd do differently, what this unlocked._",
    "",
  ].join("\n");
}

// ---- Semester MOC ----------------------------------------------------------

function renderSemester(s: Semester): string {
  const moduleLines = s.modules
    .map((m) => {
      const art = m.weekDetails.find((w) => w.artifact);
      const artPart = art?.artifact
        ? ` · ${link(artifactLinkBase(art.n, art.artifact.title), `A${pad2(artifactNumberFor(art.n))}`)}`
        : "";
      return `- ${link(moduleLinkBase(m))} · Weeks ${m.weeks[0]}–${m.weeks[1]}${artPart}`;
    })
    .join("\n");

  const weekLines = s.modules
    .flatMap((m) => m.weekDetails)
    .map((w) => `- [ ] ${link(weekLinkBase(w))}${w.artifact ? " — artifact" : ""}`)
    .join("\n");

  const artifactLines = s.modules
    .flatMap((m) => m.weekDetails)
    .flatMap((w) =>
      w.artifact
        ? [
            `- ${link(artifactLinkBase(w.n, w.artifact.title))} — W${pad2(w.n)} · ${w.artifact.kind}`,
          ]
        : [],
    )
    .join("\n");

  const header = fm({
    type: "semester",
    semester: s.n,
    weeks: [s.weeks[0], s.weeks[1]],
    title: s.title,
  });

  return [
    header,
    `# S${s.n} — ${s.title}`,
    "",
    `> ${s.subtitle}`,
    "",
    `Weeks ${s.weeks[0]}–${s.weeks[1]} · ${s.modules.length} modules · ${s.modules.filter((m) => m.weekDetails.some((w) => w.artifact)).length} artifacts`,
    "",
    "## Modules",
    "",
    moduleLines,
    "",
    "## Progress — weeks",
    "",
    weekLines,
    "",
    "## Artifacts",
    "",
    artifactLines,
    "",
    "## Semester reflection",
    "",
    "_Write at the end: what did this semester change in how I think? What's the through-line?_",
    "",
  ].join("\n");
}

// ---- Home dashboard --------------------------------------------------------

function renderHome(): string {
  const semesterLinks = semesters
    .map((s) => link(semesterLinkBase(s), `S${s.n} ${s.shortTitle}`))
    .join(" · ");

  // Next milestone = first waypoint past the furthest completed week.
  // Falls back to the final milestone once the programme is finished.
  const maxDone = completedWeeks.length > 0 ? Math.max(...completedWeeks) : 0;
  const nextMilestone =
    milestones.find((m) => m.week > maxDone) ?? milestones[milestones.length - 1];
  const nextFw = nextMilestone ? weekById(nextMilestone.week) : undefined;
  const nextWeekLink =
    nextFw && nextMilestone
      ? link(weekLinkBase(nextFw.week), `W${pad2(nextMilestone.week)}`)
      : nextMilestone
        ? `W${pad2(nextMilestone.week)}`
        : "—";
  const nextMilestoneLine = nextMilestone
    ? `- **Next milestone** — ${nextWeekLink} — ${nextMilestone.label} _(${nextMilestone.artifactsCompleted}/${programme.totalArtifacts})_`
    : "- **Next milestone** — _(programme complete)_";

  return [
    fm({ type: "home" }),
    `# fpl0 · MSc in Cognitive Science`,
    "",
    `> ${programme.tagline}`,
    "",
    `**${programme.totalWeeks} weeks** · **${programme.totalSemesters} semesters** · **${programme.totalModules} modules** · **${programme.totalArtifacts} artifacts** · pace ${programme.pace}`,
    "",
    "## Now",
    "",
    "- **Current week** — _(link the week you're working, e.g. `[[W01 — The Landscape]]`)_",
    "- **Current module** — _(e.g. `[[1.1 — Introduction to Cognitive Science]]`)_",
    nextMilestoneLine,
    "",
    "> Update these three links each time you start a new week. Keep statuses honest in the frontmatter of each week / artifact note.",
    "",
    "## Semesters",
    "",
    semesterLinks,
    "",
    "## Navigation",
    "",
    "- [[Milestones]] — the 21 waypoints",
    "- Library — [[Books]] · [[Papers]] · [[Courses]] · [[Curriculum.pdf|Curriculum PDF]]",
    "- [[Notes]] — atomic notes, Zettelkasten-style",
    "",
    "### Weekly budget",
    "",
    programme.weeklyBudget.map((b) => `- **${b.activity}** — ${b.hours} — ${b.note}`).join("\n"),
    "",
  ].join("\n");
}

// ---- Grades page -----------------------------------------------------------

// Initial empty grade sheet: one row per module, pre-populated with a cell for
// each week's assignment + a cell for the module's artifact. `finish-week` fills
// weekly scores in-place; `ship-artifact` fills artifact grades. The module cell
// is the unweighted mean of every filled score in its row.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: aggregating grades across semesters/modules/weeks is inherently nested; flattening hurts readability.
function renderGrades(): string {
  const parts: string[] = [
    fm({ type: "grades" }),
    "# Grades",
    "",
    "> One grade per module, aggregated from every activity in that module — each week's self-assessment score plus the module's artifact. Updated by `finish-week` (records the week's assignment score) and `ship-artifact` (records the artifact grade); hand-edit cells to override.",
    "",
    "**Scale.** Assignments are marked /100 against the Parts-A–D rubric (pass bar 70, ≥60 per section). Artifacts are self-graded /100 in each artifact note's `## Grade` section. A module grade is the unweighted mean of every filled cell in its row.",
    "",
    "**Cell notation.** `— (0/N)` = nothing recorded, `N` activities still to assess. `82 (3/4)` = running mean of 82 across 3 recorded activities out of 4.",
    "",
  ];

  for (const s of semesters) {
    parts.push(`## Semester ${s.n} — ${s.title}`, "");
    parts.push("| Module | Title | Weeks | Assignments | Artifact | **Module** |");
    parts.push("|--------|-------|-------|-------------|----------|------------|");
    for (const m of s.modules) {
      const weeks = m.weekDetails;
      const nWeeks = weeks.length;
      const firstWeek = weeks[0];
      const lastWeek = weeks[nWeeks - 1];
      if (!(firstWeek && lastWeek)) continue;
      const artifactWeek = weeks.find((w) => w.artifact);
      const aNum = artifactWeek ? artifactNumberFor(artifactWeek.n) : null;
      const aTitle = artifactWeek?.artifact ? shortArtifactTitle(artifactWeek.artifact.title) : "";
      const artifactLink =
        artifactWeek?.artifact && aNum !== null
          ? `[[${artifactLinkBase(artifactWeek.n, artifactWeek.artifact.title)}\\|A${pad2(aNum)}]]`
          : "—";
      const weekRange = `W${pad2(firstWeek.n)}–W${pad2(lastWeek.n)}`;
      const totalActivities = nWeeks + (artifactWeek ? 1 : 0);
      const moduleTitleLink = `[[${moduleLinkBase(m)}\\|${m.title}]]`;
      const assignmentsCell = `— (0/${nWeeks})`;
      const artifactCell = artifactWeek ? `${artifactLink} —` : "—";
      const moduleCell = `**— (0/${totalActivities})**`;
      void aTitle; // available if we ever want the artifact short-title in the cell
      parts.push(
        `| **${m.code}** | ${moduleTitleLink} | ${weekRange} | ${assignmentsCell} | ${artifactCell} | ${moduleCell} |`,
      );
    }
    parts.push("");
  }

  parts.push("## Summary", "");
  parts.push(`- **Programme mean:** — /100 _(across 0 modules with any activity recorded)_`);
  parts.push(`- **Modules at pass bar (≥70):** 0 / ${semesters.flatMap((s) => s.modules).length}`);
  parts.push(`- **Weeks assessed:** 0 / ${programme.totalWeeks}`);
  parts.push(`- **Artifacts graded:** 0 / ${programme.totalArtifacts}`);
  parts.push("");

  return parts.join("\n");
}

// ---- Milestones page -------------------------------------------------------

function renderMilestones(): string {
  const rows = milestones.map((m) => {
    const fw = weekById(m.week);
    const weekLink = fw ? link(weekLinkBase(fw.week), `W${pad2(m.week)}`) : `W${pad2(m.week)}`;
    const artPart = fw?.week.artifact
      ? ` — ${link(artifactLinkBase(fw.week.n, fw.week.artifact.title), shortArtifactTitle(fw.week.artifact.title))}`
      : "";
    return `- [ ] ${m.major ? "**" : ""}${weekLink} — ${m.label}${m.major ? "**" : ""}${artPart} _(${m.artifactsCompleted}/${programme.totalArtifacts})_`;
  });

  return [
    fm({ type: "milestones" }),
    "# Milestones",
    "",
    `> The ${milestones.length} waypoints across the ${programme.totalWeeks}-week programme. Tick each as you pass it.`,
    "",
    rows.join("\n"),
    "",
  ].join("\n");
}

// ---- Library indexes -------------------------------------------------------

function renderPapers(papers: ParsedPaper[]): string {
  const parts: string[] = [fm({ type: "library", library: "papers" }), "# Papers", ""];
  parts.push(
    "> Primary papers referenced across the curriculum. Each paper has its own note in `Library/Papers/`. Click through to take deep reading notes — links are wired everywhere the paper is referenced in the vault.",
    "",
    `**${papers.length} papers total**, grouped below by the semester and module where each first appears.`,
    "",
  );
  for (const s of semesters) {
    const semPapers = papers.filter((p) =>
      s.modules.some((m) => m.weekDetails.some((w) => p.weeks.includes(w.n))),
    );
    if (semPapers.length === 0) continue;
    parts.push(`## S${s.n} — ${s.title}`, "");
    for (const m of s.modules) {
      const modPapers = papers.filter((p) => p.moduleCode === m.code);
      if (modPapers.length === 0) continue;
      parts.push(`### ${m.code} ${m.title}`, "");
      for (const p of modPapers) {
        const weeksStr = p.weeks.map((n) => `W${pad2(n)}`).join(", ");
        parts.push(`- ${link(paperLinkBase(p), paperBaseName(p))} _(${weeksStr})_`);
      }
      parts.push("");
    }
  }
  return `${parts.join("\n")}\n`;
}

function renderBooks(): string {
  const parts: string[] = [fm({ type: "library", library: "books" }), "# Books", ""];
  parts.push(
    "> Textbooks and long-form works. Each book has its own note in `Library/Books/` — click through to take deep reading notes. Cross-linked wherever the book appears in week readings.",
    "",
    `**${BOOKS.length} books total**, grouped by the module where each is introduced.`,
    "",
  );
  for (const s of semesters) {
    const semBooks = BOOKS.filter((b) => s.modules.some((m) => m.code === b.moduleCode));
    if (semBooks.length === 0) continue;
    parts.push(`## S${s.n} — ${s.title}`, "");
    for (const m of s.modules) {
      const modBooks = BOOKS.filter((b) => b.moduleCode === m.code);
      if (modBooks.length === 0) continue;
      parts.push(`### ${m.code} ${m.title}`, "");
      for (const b of modBooks) {
        const weeksStr = b.weeks.map((n) => `W${pad2(n)}`).join(", ");
        const suffix = b.note ? ` — _${b.note}_` : "";
        parts.push(`- ${link(bookLinkBase(b), bookBaseName(b))} _(${weeksStr})_${suffix}`);
      }
      parts.push("");
    }
  }
  return `${parts.join("\n")}\n`;
}

function renderCourses(): string {
  const parts: string[] = [fm({ type: "library", library: "courses" }), "# Courses & lectures", ""];
  parts.push(
    "> Video lecture series referenced across the curriculum. Each course has its own note in `Library/Courses/` — track what you've watched there. Cross-linked from every week that assigns it.",
    "",
    `**${COURSES.length} courses total**, grouped by the module where each is introduced.`,
    "",
  );
  for (const s of semesters) {
    const semCourses = COURSES.filter((c) => s.modules.some((m) => m.code === c.moduleCode));
    if (semCourses.length === 0) continue;
    parts.push(`## S${s.n} — ${s.title}`, "");
    for (const m of s.modules) {
      const modCourses = COURSES.filter((c) => c.moduleCode === m.code);
      if (modCourses.length === 0) continue;
      parts.push(`### ${m.code} ${m.title}`, "");
      for (const c of modCourses) {
        const weeksStr = c.weeks.map((n) => `W${pad2(n)}`).join(", ");
        parts.push(`- ${link(courseLinkBase(c), c.label)} _(${weeksStr})_`);
      }
      parts.push("");
    }
  }
  return `${parts.join("\n")}\n`;
}

// ---- Book / Course / Paper stub pages ---------------------------------

function renderBookStub(b: BookEntry): string {
  const weeks = b.weeks
    .map((n) => {
      const fw = weekById(n);
      return fw ? `- ${link(weekLinkBase(fw.week))}` : `- W${pad2(n)}`;
    })
    .join("\n");
  const mod = semesters.flatMap((s) => s.modules).find((m) => m.code === b.moduleCode);
  const modLink = mod ? link(moduleLinkBase(mod)) : b.moduleCode;

  return [
    fm({
      type: "book",
      title: b.title,
      authors: b.authors,
      module: b.moduleCode,
      weeks: b.weeks,
      status: "to-read",
      ...(b.note ? { note: b.note } : {}),
    }),
    `# ${b.title}`,
    "",
    `> **${b.authors}**${b.note ? ` · _${b.note}_` : ""}`,
    "",
    `Introduced in module ${modLink}.`,
    "",
    "## Assigned in",
    "",
    weeks,
    "",
    "## Why this book",
    "",
    "_The angle the curriculum takes with this book — what it's meant to teach you._",
    "",
    "## Chapter notes",
    "",
    "### Ch X — …",
    "",
    "## Arguments to remember",
    "",
    "## Quotes",
    "",
    "## Connections",
    "",
    "_Links to papers, weeks, and concepts that resonate with this book._",
    "",
  ].join("\n");
}

function renderCourseStub(c: CourseEntry): string {
  const weeks = c.weeks
    .map((n) => {
      const fw = weekById(n);
      return fw ? `- ${link(weekLinkBase(fw.week))}` : `- W${pad2(n)}`;
    })
    .join("\n");
  const mod = semesters.flatMap((s) => s.modules).find((m) => m.code === c.moduleCode);
  const modLink = mod ? link(moduleLinkBase(mod)) : c.moduleCode;

  return [
    fm({
      type: "course",
      title: c.title,
      provider: c.provider,
      ...(c.instructor ? { instructor: c.instructor } : {}),
      module: c.moduleCode,
      weeks: c.weeks,
      status: "to-watch",
      ...(c.url ? { url: c.url } : {}),
    }),
    `# ${c.title}`,
    "",
    `> **${c.provider}**${c.instructor ? ` · ${c.instructor}` : ""}`,
    "",
    `Introduced in module ${modLink}.`,
    "",
    "## Assigned in",
    "",
    weeks,
    "",
    "## Lectures watched",
    "",
    "_Track which lectures you've finished. Use checkboxes, note dates if useful._",
    "",
    "- [ ] Lecture 1",
    "- [ ] Lecture 2",
    "",
    "## Key ideas",
    "",
    "## Connections",
    "",
  ].join("\n");
}

function renderPaperStub(p: ParsedPaper): string {
  const weeks = p.weeks
    .map((n) => {
      const fw = weekById(n);
      return fw ? `- ${link(weekLinkBase(fw.week))}` : `- W${pad2(n)}`;
    })
    .join("\n");
  const mod = semesters.flatMap((s) => s.modules).find((m) => m.code === p.moduleCode);
  const modLink = mod ? link(moduleLinkBase(mod)) : p.moduleCode;

  const headerTitle = p.title ? `${p.authorYear} — ${p.title}` : p.authorYear;

  return [
    fm({
      type: "paper",
      authorYear: p.authorYear,
      title: p.title,
      module: p.moduleCode,
      weeks: p.weeks,
      status: "to-read",
    }),
    `# ${headerTitle}`,
    "",
    `> ${p.firstRawText}`,
    "",
    `Introduced in module ${modLink}.`,
    "",
    "## Assigned in",
    "",
    weeks,
    "",
    "## One-sentence summary",
    "",
    "## Claim",
    "",
    "_The central claim, in the authors' own terms._",
    "",
    "## Evidence",
    "",
    "## Method",
    "",
    "## What's new",
    "",
    "## What I buy / don't buy",
    "",
    "## Connections",
    "",
    "_Link to weeks, concepts, and other papers._",
    "",
    "## Quotes",
    "",
    "## Citation",
    "",
    "```",
    "",
    "```",
    "",
  ].join("\n");
}

// ---- Notes index -----------------------------------------------------------

function renderNotesIndex(): string {
  return [
    fm({ type: "notes-index" }),
    "# Notes",
    "",
    "> Atomic, Zettelkasten-style notes — one concept per file, densely linked.",
    "",
    "A good note:",
    "",
    "- is small (a paragraph or two) and self-contained",
    "- is _titled as a claim_ when possible (e.g. `Dopamine encodes reward prediction error`) rather than a generic noun (`Dopamine`)",
    "- links to the weeks, papers, and other concepts it touches",
    "- is something you'd want to reach for in a year, not a dump of lecture notes",
    "",
    "Create a new note with the `Concept` template (Cmd-P → _Templates: Insert template_).",
    "",
    "## Index",
    "",
    "_This page is intentionally thin — use backlinks and the graph view to navigate._",
    "",
  ].join("\n");
}

// ---- Templates -------------------------------------------------------------

function tplPaper(): string {
  return [
    "---",
    "type: paper",
    'authors: ""',
    "year: ",
    'title: ""',
    'venue: ""',
    'doi: ""',
    'week: ""',
    'module: ""',
    'status: "to-read"  # to-read | reading | read',
    "---",
    "",
    "# {{title}}",
    "",
    "> **Authors** — …   **Year** — …   **Venue** — …",
    "",
    "## One-sentence summary",
    "",
    "## Claim",
    "",
    "_The central claim, in the authors' terms._",
    "",
    "## Evidence",
    "",
    "## Method",
    "",
    "## What's new",
    "",
    "## What I buy / don't buy",
    "",
    "## Connections",
    "",
    "_Link to weeks, concepts, other papers._",
    "",
    "## Quotes",
    "",
    "## Citation",
    "",
    "```",
    "",
    "```",
    "",
  ].join("\n");
}

function tplBook(): string {
  return [
    "---",
    "type: book",
    'title: ""',
    'author: ""',
    "year: ",
    'module: ""',
    'status: "to-read"  # to-read | reading | read',
    "---",
    "",
    "# {{title}}",
    "",
    "> **Author** — …   **Year** — …",
    "",
    "## Why this book",
    "",
    "## Chapter notes",
    "",
    "### Ch X — …",
    "",
    "## Arguments to remember",
    "",
    "## Quotes",
    "",
    "## Connections",
    "",
  ].join("\n");
}

function tplConcept(): string {
  return [
    "---",
    "type: concept",
    'tags: ["concept"]',
    "---",
    "",
    "# {{title}}",
    "",
    "> _One-sentence gloss of the claim or idea._",
    "",
    "## Why it matters",
    "",
    "## Evidence / justification",
    "",
    "## Tensions / open questions",
    "",
    "## Connections",
    "",
    "_Link to weeks, papers, and other concepts._",
    "",
  ].join("\n");
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  heading(`Generate MSc vault`);
  info(`vault: ${VAULT}`);
  info(`force: ${FORCE ? "yes (overwrite existing)" : "no (skip existing)"}`);

  if (!existsSync(VAULT)) {
    warn(`vault path does not exist — creating: ${VAULT}`);
    await ensureDir(VAULT);
  }

  // Root pages
  await write("Home.md", renderHome());
  await write("Milestones.md", renderMilestones());
  await write("Grades.md", renderGrades());

  // Semester MOCs
  for (const s of semesters) {
    await write(`Semesters/${semesterFilename(s)}`, renderSemester(s));
  }

  // Modules
  for (const s of semesters) {
    for (const m of s.modules) {
      await write(`Modules/${moduleFilename(m)}`, renderModule(m, s));
    }
  }

  // Weeks + artifacts (artifacts live under Library/Artifacts/)
  for (const fw of flatWeeks) {
    await write(`Weeks/${weekFilename(fw.week)}`, renderWeek(fw));
    if (fw.week.artifact) {
      await write(
        `Library/Artifacts/${artifactFilename(fw.week.n, fw.week.artifact.title)}`,
        renderArtifact(fw),
      );
    }
  }

  // Library
  const papers = discoverPapers();
  await write("Library/Papers.md", renderPapers(papers));
  await write("Library/Books.md", renderBooks());
  await write("Library/Courses.md", renderCourses());
  // Curriculum PDF — source of truth lives in blog repo, copy here for offline use.
  await copy(join(process.cwd(), "public/msc-curriculum.pdf"), "Library/Curriculum.pdf");

  // Per-item stubs. Skip-if-exists by default preserves user-written reading
  // notes; --force regenerates. Week notes cross-link into these files.
  for (const b of BOOKS) {
    await write(`Library/Books/${bookFilename(b)}`, renderBookStub(b));
  }
  for (const c of COURSES) {
    await write(`Library/Courses/${courseFilename(c)}`, renderCourseStub(c));
  }
  for (const p of papers) {
    await write(`Library/Papers/${paperLinkBase(p)}.md`, renderPaperStub(p));
  }

  // Notes (Zettelkasten) index
  await write("Notes/Notes.md", renderNotesIndex());

  // Templates
  await write("_Templates/Paper.md", tplPaper());
  await write("_Templates/Book.md", tplBook());
  await write("_Templates/Concept.md", tplConcept());

  console.log("");
  success(`wrote ${wrote} files · skipped ${skipped}`);
}

await main();

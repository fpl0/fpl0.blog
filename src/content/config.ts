/**
 * Content Collection Schemas
 *
 * Defines the frontmatter structure for blog posts and apps.
 * The `date` field is computed from publicationDate or createdDate.
 */

import { glob } from "astro/loaders";

import { defineCollection, z } from "astro:content";
import { SUMMARY_MAX, SUMMARY_MIN } from "../../scripts/constants";
import { slugifyNoteName } from "../utils/vault";

/**
 * Base fields shared by all publishable content.
 * Both blog posts and apps share date handling, draft status, and tags.
 */
const baseFields = {
  title: z.string(),
  summary: z
    .string()
    .min(SUMMARY_MIN, `Summary must be at least ${SUMMARY_MIN} characters`)
    .max(SUMMARY_MAX, `Summary must be ${SUMMARY_MAX} characters or less`),
  tags: z.array(z.string()).default([]),
  isDraft: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  createdDate: z.coerce.date(),
  publicationDate: z.coerce.date().optional(),
} as const;

/** Shared refinement: publicationDate must be on or after createdDate. */
function refinePublicationDate(data: { createdDate: Date; publicationDate?: Date }) {
  return !data.publicationDate || data.publicationDate >= data.createdDate;
}

const publicationDateError = {
  message: "publicationDate must be on or after createdDate",
  path: ["publicationDate"],
};

/** Shared transform: compute `date` from publicationDate or createdDate. */
function computeDate<T extends { createdDate: Date; publicationDate?: Date }>(data: T) {
  return { ...data, date: data.publicationDate ?? data.createdDate };
}

const blog = defineCollection({
  type: "content",
  schema: z
    .object({
      ...baseFields,
      author: z.string().min(1).default("Filipe Lima"),
      image: z.string().optional(),
    })
    .refine(refinePublicationDate, publicationDateError)
    .transform(computeDate),
});

/**
 * Apps are co-located directories under src/content/apps/<slug>/ containing
 * App.astro + index.md. The glob pattern matches ONLY index.md/mdx, so
 * stray files (e.g. a .claude/settings.local.json that Claude Code's
 * permission system may drop into the working directory) are never picked
 * up by the content collection. generateId strips the "/index.md" suffix
 * so the entry id equals the directory slug (e.g. "msc-cogsci").
 */
const apps = defineCollection({
  loader: glob({
    pattern: "**/index.{md,mdx}",
    base: "./src/content/apps",
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ""),
  }),
  schema: z
    .object({
      ...baseFields,
      /**
       * When true, the app renders in document mode — the AppShell bar stays
       * fixed, but the body scrolls naturally instead of being clamped to
       * 100vh. Use for content-heavy apps (progress trackers, dashboards).
       */
      scrollable: z.boolean().default(false),
    })
    .refine(refinePublicationDate, publicationDateError)
    .transform(computeDate)
    .transform((data) => ({
      ...data,
      tags: data.tags.includes("app") ? data.tags : ["app", ...data.tags],
    })),
});

/**
 * Vault notes — all markdown from the Obsidian MSc vault, excluding
 * templates, raw file attachments, and private notes.
 * Requires a symlink: fpl0.blog/vault → the iCloud-synced vault directory.
 */
const vaultNotes = defineCollection({
  loader: glob({
    pattern: ["**/*.md", "!_Templates/**", "!Library/Files/**", "!Notes/private/**", "!CLAUDE.md"],
    base: "./vault",
    generateId: ({ entry }) => {
      const basename = entry.split("/").pop() ?? entry;
      return slugifyNoteName(basename);
    },
  }),
  schema: z
    .object({
      type: z.string().optional(),
      title: z.string().optional(),
      status: z.string().optional(),
      week: z.number().optional(),
      module: z.string().optional(),
      semester: z.number().optional(),
      artifact: z.number().optional(),
      authorYear: z.string().optional(),
      url: z.string().optional(),
    })
    .passthrough(),
});

export const collections = { blog, apps, vaultNotes } as const;

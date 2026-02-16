/**
 * Content Collection Schemas
 *
 * Defines the frontmatter structure for blog posts and apps.
 * The `date` field is computed from publicationDate or createdDate.
 */

import { defineCollection, z } from "astro:content";
import { SUMMARY_MAX, SUMMARY_MIN } from "../../scripts/constants";

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

/**
 * Shared schema for publishable content (used by apps collection).
 */
const publishableSchema = z
  .object(baseFields)
  .refine(refinePublicationDate, publicationDateError)
  .transform(computeDate);

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

const apps = defineCollection({
  type: "content",
  schema: publishableSchema.transform((data) => ({
    ...data,
    tags: data.tags.includes("app") ? data.tags : ["app", ...data.tags],
  })),
});

export const collections = { blog, apps } as const;

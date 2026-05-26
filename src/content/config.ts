import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

const paintings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paintings' }),
  schema: z.object({
    title: z.string(),
    medium: z.enum([
      'oil',
      'watercolor',
      'pen-and-ink',
      'pencil',
      'charcoal',
      'pastels',
      'acrylic',
      'mixed-media',
    ]),
    // .nullish() = accepts null OR undefined — Sveltia writes empty
    // optional fields as `null` in YAML, which plain .optional() rejects.
    year: z.number().int().min(1900).max(2100).nullish(),
    dimensions: z.string().nullish(),
    price: z.string().nullish(),
    image: z.string(),
    order: z.number().int().nullish(),
    sold: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const shows = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shows' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    location: z.string().nullish(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().nullish(),
    link: z.string().url().nullish(),
  }),
});

/**
 * Static-but-editable pages (studio, about, contact). Each page is a
 * single markdown file in src/content/pages/. The .astro template at
 * src/pages/<page>.astro reads the file and renders it. Sveltia
 * exposes each as a fixed-file editor entry under "Pages".
 *
 * Schema is permissive — different pages use different fields
 * (e.g. contact has `email`, the others don't).
 */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    lead: z.string().nullish(),
    email: z.string().nullish(),
  }),
});

export const collections = { paintings, shows, pages };

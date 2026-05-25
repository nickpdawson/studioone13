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
    year: z.number().int().min(1900).max(2100).optional(),
    dimensions: z.string().optional(),
    image: z.string(),
    order: z.number().int().optional(),
    sold: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

const shows = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shows' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    location: z.string().optional(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date().optional(),
    link: z.string().url().optional(),
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
    lead: z.string().optional(),
    email: z.string().optional(),
  }),
});

export const collections = { paintings, shows, pages };

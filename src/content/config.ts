import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const paintings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paintings' }),
  schema: z.object({
    title: z.string(),
    medium: z.enum(['oil', 'watercolor']),
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

export const collections = { paintings, shows };

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.date(),
      category: z.string(),
      excerpt: z.string(),
      image: image().optional(),
    }),
});

export const collections = { news };

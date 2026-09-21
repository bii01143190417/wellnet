import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';

function microCmsNewsLoader(): Loader {
  return {
    name: 'microcms-news-loader',
    load: async ({ store, logger }) => {
      const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
      const apiKey = import.meta.env.MICROCMS_API_KEY;

      if (!serviceDomain || !apiKey) {
        logger.warn('MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていないため、お知らせを取得できません。');
        return;
      }

      store.clear();

      const limit = 100;
      let offset = 0;
      while (true) {
        const res = await fetch(
          `https://${serviceDomain}.microcms.io/api/v1/news?limit=${limit}&offset=${offset}`,
          { headers: { 'X-MICROCMS-API-KEY': apiKey } }
        );
        if (!res.ok) {
          throw new Error(`microCMS news fetch failed: ${res.status} ${res.statusText}`);
        }
        const json = await res.json();

        for (const item of json.contents) {
          store.set({
            id: item.id,
            data: {
              title: item.title,
              date: new Date(item.date ?? item.publishedAt),
              category: item.category ?? '',
              excerpt: item.excerpt ?? '',
              image: item.image ?? undefined,
              programSlug: item.programSlug ?? [],
              body: item.body ?? '',
            },
          });
        }

        offset += limit;
        if (offset >= json.totalCount) break;
      }
    },
  };
}

const news = defineCollection({
  loader: microCmsNewsLoader(),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    category: z.string(),
    excerpt: z.string(),
    image: z
      .object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      })
      .optional(),
    programSlug: z.array(z.string()).default([]),
    body: z.string(),
  }),
});

export const collections = { news };

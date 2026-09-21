import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';

async function* fetchAllMicroCmsContents(endpoint: string) {
  const serviceDomain = import.meta.env.MICROCMS_SERVICE_DOMAIN;
  const apiKey = import.meta.env.MICROCMS_API_KEY;

  if (!serviceDomain || !apiKey) {
    throw new Error('MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が設定されていません。');
  }

  const limit = 100;
  let offset = 0;
  while (true) {
    const res = await fetch(
      `https://${serviceDomain}.microcms.io/api/v1/${endpoint}?limit=${limit}&offset=${offset}`,
      { headers: { 'X-MICROCMS-API-KEY': apiKey } }
    );
    if (!res.ok) {
      throw new Error(`microCMS ${endpoint} fetch failed: ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    for (const item of json.contents) yield item;

    offset += limit;
    if (offset >= json.totalCount) break;
  }
}

function microCmsNewsLoader(): Loader {
  return {
    name: 'microcms-news-loader',
    load: async ({ store, logger }) => {
      store.clear();
      try {
        for await (const item of fetchAllMicroCmsContents('news')) {
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
      } catch (err) {
        logger.warn(`お知らせを取得できませんでした: ${err}`);
      }
    },
  };
}

function microCmsDocumentsLoader(): Loader {
  return {
    name: 'microcms-documents-loader',
    load: async ({ store, logger }) => {
      store.clear();
      try {
        for await (const item of fetchAllMicroCmsContents('documents')) {
          store.set({
            id: item.id,
            data: {
              name: item.name,
              url: item.file ?? '',
            },
          });
        }
      } catch (err) {
        logger.warn(`資料を取得できませんでした: ${err}`);
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

const documents = defineCollection({
  loader: microCmsDocumentsLoader(),
  schema: z.object({
    name: z.string(),
    url: z.string(),
  }),
});

function microCmsReportLoader(): Loader {
  return {
    name: 'microcms-report-loader',
    load: async ({ store, logger }) => {
      store.clear();
      try {
        for await (const item of fetchAllMicroCmsContents('report')) {
          store.set({
            id: item.id,
            data: {
              title: item.title,
              date: new Date(item.date ?? item.publishedAt),
              body: item.body ?? '',
              images: item.images ?? [],
            },
          });
        }
      } catch (err) {
        logger.warn(`活動報告を取得できませんでした: ${err}`);
      }
    },
  };
}

const report = defineCollection({
  loader: microCmsReportLoader(),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    body: z.string(),
    images: z.array(
      z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
      })
    ),
  }),
});

export const collections = { news, documents, report };

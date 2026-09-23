// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://bii01143190417.github.io',
  base: '/wellnet',
  image: {
    domains: ['images.microcms-assets.io'],
  },
});

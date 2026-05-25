import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://one13studio.com',
  output: 'static',
  build: {
    format: 'directory',
  },
});

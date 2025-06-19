import { defineConfig } from 'vite'
import Sitemap from 'vite-plugin-sitemap'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/json-to-vtt-caprinosol/',
  plugins: [
    tailwindcss(),
    Sitemap({
      hostname: 'https://luisdamora.github.io/json-to-vtt-caprinosol/',
      basePath: '/json-to-vtt-caprinosol',
      dynamicRoutes: [
        '/',
      ],
      outDir: 'dist'
    }),
  ],
})


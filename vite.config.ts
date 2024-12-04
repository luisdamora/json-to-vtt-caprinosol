import { defineConfig } from 'vite'
import Sitemap from 'vite-plugin-sitemap'



export default defineConfig({
  base: '/json-to-vtt-caprinosol/',
  plugins: [
    Sitemap({
      hostname: 'https://luisdamora.github.io/json-to-vtt-caprinosol/',
      dynamicRoutes: [
        '/',
      ],
      outDir: 'dist'
    }),
  ],
})


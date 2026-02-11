import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { glob } from 'glob'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        glob.sync([
          'index.html',
          '*/index.html',
          'admin/index.html',
          'pages/**/index.html',
          'property/**/index.html',
          'listings/**/index.html',
          'services/**/index.html'
        ]).map(file => [
          file.replace(/\/index\.html$/, '').replace(/\//g, '-') || 'main',
          resolve(__dirname, file)
        ])
      ),
    },
  },
})

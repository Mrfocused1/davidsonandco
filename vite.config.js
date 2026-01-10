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
        glob.sync(['*.html', 'admin/*.html', 'pages/**/*.html']).map(file => [
          file.replace(/\.html$/, '').replace(/\//g, '-'),
          resolve(__dirname, file)
        ])
      ),
    },
  },
})

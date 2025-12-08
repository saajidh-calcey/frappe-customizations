// frontend/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: path.resolve(__dirname, '../customizations/public/js'),
    emptyOutDir: false, // Don't delete other files in public/js
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'SurveyApp',
      fileName: (format) => `survey.bundle.js`
    },
    rollupOptions: {
      external: ['vue', 'frappe', 'frappe-ui'],
      output: {
        format: 'iife',
        // Provide global variables for external dependencies
        globals: {
          vue: 'Vue',
          frappe: 'frappe',
          'frappe-ui': 'FrappeUI'
        }
      }
    }
  }
})
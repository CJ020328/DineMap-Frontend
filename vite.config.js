import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import _ from 'lodash'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lodash'],
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    sourcemap: false,
  },
});

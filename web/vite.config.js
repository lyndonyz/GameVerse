import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      // "/api": "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud",
    },
  },
  build: {
    sourcemap: false,
  },
});

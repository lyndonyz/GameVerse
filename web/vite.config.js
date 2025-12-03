import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Explicitly confirm the desired modern runtime
      jsxRuntime: 'automatic', 
    }),
  ],
  server: {
    proxy: {
      // "/api": "http://localhost:8080",
      "/api": "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud",
    },
  },
});

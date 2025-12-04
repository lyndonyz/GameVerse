import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // "/api": "http://localhost:8000",
      "/api": "https://my-backend-api.23gzti4bhp77.ca-tor.codeengine.appdomain.cloud",
    },
  },
});

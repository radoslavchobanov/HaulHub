import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = parseInt(process.env.FRONTEND_PORT || '5173')
const nginxPort = parseInt(process.env.NGINX_PORT || '8090')

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port,
    hmr: {
      clientPort: nginxPort,
    },
  },
})

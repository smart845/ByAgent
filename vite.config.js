import { defineConfig } from 'vite'
export default defineConfig({
  server: {
    port: 5173,
    proxy: { '/bybit': { target: 'https://api.bybit.com', changeOrigin: true, secure: true, rewrite: (p)=>p.replace(/^\/bybit/,'') } }
  }
})
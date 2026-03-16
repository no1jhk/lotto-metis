import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 로컬 개발 시 /api/lotto → Vercel 배포 URL로 프록시
      // (로컬 Vercel CLI 없이도 테스트 가능)
      '/api': {
        target: 'https://lotto-metis.vercel.app',
        changeOrigin: true,
      }
    }
  }
})

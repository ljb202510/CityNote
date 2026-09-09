import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: '/citynote/',
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // 后端无 context-path，nginx 用 rewrite 去掉 /api，dev 必须保持一致
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, '')
      },
      // 图片静态资源仍由 nginx（8080）托管，零拷贝复用旧图
      '/imgs': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  }
})

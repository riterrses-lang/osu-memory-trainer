import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // ВАЖНО: укажите название вашего репозитория в кавычках!
  base: '/osu-memory-trainer/', 
  plugins: [react()],
  worker: {
    format: 'module', // Для корректной работы Web Workers
  },
})

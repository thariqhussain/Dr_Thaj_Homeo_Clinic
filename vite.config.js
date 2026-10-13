import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        /* libraries change rarely, so keep them in their own files: the browser caches them
           across deploys and downloads them in parallel with the app code */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/gsap/')) return 'gsap';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react';
        },
      },
    },
  },
});
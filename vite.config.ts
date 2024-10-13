import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), UnoCSS(), svgr()],
  resolve: {
    alias: [
      { find: '@api', replacement: path.resolve(__dirname, 'src/api/') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks/') },
      { find: '@my-types', replacement: path.resolve(__dirname, 'src/types/') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/assets/') },
    ]
  },
})

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/frontend-learning-system/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      'yuan-ui/style.css': resolve(__dirname, '../packages/yuan-ui/src/components/Loading/Loading.css'),
      'yuan-ui': resolve(__dirname, '../packages/yuan-ui/src/index.js'),
    },
  },
}));

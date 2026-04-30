import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';

const repoBase = '/work-grid/';

function spa404Fallback(outDir = 'dist'): PluginOption {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const index = resolve(process.cwd(), outDir, 'index.html');
      if (existsSync(index)) {
        copyFileSync(index, resolve(process.cwd(), outDir, '404.html'));
      }
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? repoBase : '/',
  plugins: [react(), spa404Fallback()],
}));

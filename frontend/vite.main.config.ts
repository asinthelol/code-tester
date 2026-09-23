import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'electron/main.ts',
      fileName: () => '[name].cjs',
      formats: ['cjs'],
    },
  },
});

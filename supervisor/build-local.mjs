import { build } from 'esbuild';
import { cpSync, mkdirSync } from 'node:fs';

await build({
  entryPoints: ['src/local.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/local.js',
});

mkdirSync('dist/workers/python', { recursive: true });
cpSync('src/workers/python', 'dist/workers/python', {
  recursive: true,
  filter: (src) => !src.endsWith('.ts'),
});

import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/index.js',
  // npm dependencies get installed in the image
  external: Object.keys(pkg.dependencies ?? {}),
});

mkdirSync('dist/workers/python', { recursive: true });
cpSync('src/workers/python', 'dist/workers/python', {
  recursive: true,
  filter: (src) => !src.endsWith('.ts'),
});

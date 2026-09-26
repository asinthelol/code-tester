import { build } from 'esbuild';

await build({
  entryPoints: ['src/local.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/local.js',
});

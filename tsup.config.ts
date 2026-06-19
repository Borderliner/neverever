import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  // Dual output: ESM (index.js, since "type": "module") + CJS (index.cjs).
  format: ['esm', 'cjs'],
  // Emit declaration files for both module systems (index.d.ts + index.d.cts).
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2021',
  // Library has no runtime dependencies; nothing to bundle in.
  external: [],
})

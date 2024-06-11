import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: [
      'src/index.ts'
    ],
    replaceNodeEnv: true,
    format: ['esm'],
    dts: true,
    sourcemap: false,
    clean: true,
    target: 'es2022',
    minify: options.minify,
    watch: options.watch,
  }
})

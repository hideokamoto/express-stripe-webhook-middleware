import { defineConfig } from 'vite';
import { copyFileSync } from 'fs';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'test/**/*'],
      // dist/index.cjs (require) needs its own declaration file. Reusing the ESM
      // dist/index.d.ts for require makes TypeScript (node16/nodenext) treat the
      // package as ESM. The module only has named exports, so the same declarations
      // are valid as CommonJS types once they live in a .d.cts file.
      afterBuild: () => {
        copyFileSync(
          resolve(__dirname, 'dist/index.d.ts'),
          resolve(__dirname, 'dist/index.d.cts')
        );
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ExpressStripeWebhookMiddleware',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      external: ['express', 'stripe', 'body-parser'],
      output: {
        globals: {
          express: 'express',
          stripe: 'Stripe',
          'body-parser': 'bodyParser',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});

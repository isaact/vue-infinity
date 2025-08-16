// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isCE = mode === 'ce';

  return {
    plugins: [
      vue(isCE ? { customElement: true } : {}),
      dts({ include: ['src'] }),
    ],
    build: {
      lib: isCE
        ? {
            entry: path.resolve(__dirname, 'src/components/Gallery.ce.vue'),
            formats: ['es'],
            fileName: 'gallery-ce',
          }
        : {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'VueInfinity',
            fileName: (format) => `vue-infinity.${format}.js`,
          },
      rollupOptions: !isCE
        ? {
            external: ['vue'],
            output: {
              globals: {
                vue: 'Vue',
              },
            },
          }
        : {},
      cssCodeSplit: false,
    },
  };
});

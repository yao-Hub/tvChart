import { defineConfig, loadEnv, ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path"
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig((mode: ConfigEnv) => {
  const env = loadEnv(mode.mode, process.cwd());
  return {
    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
    ],
    resolve: {
      alias: {
        '@': resolve('./src'),
        '#': resolve('./src/types'),
        'utils': resolve('./src/utils'),
        'api': resolve('./src/api'),
        'public': resolve('./public')
      }
    },
    server: {
      proxy: {
        [env.VITE_HTTP_BASE_URL]: {
          target: env.VITE_HTTP_URL,
          changeOrigin: true,
          rewrite: path => path.replace(new RegExp('^' + env.VITE_HTTP_BASE_URL), '')
        }
      }
    }
  }
})
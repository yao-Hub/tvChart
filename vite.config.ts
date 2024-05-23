import { defineConfig, loadEnv, ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path"
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig((mode: ConfigEnv) => {
  const env = loadEnv(mode.mode, process.cwd());
  // const root = process.cwd();
  return {
    base: '/',
    // root,
    build: {
      minify: 'terser'
    },
    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
      visualizer({
        open: false,  //注意这里要设置为true，否则无效
        filename: "stats.html", //分析图生成的文件名
        gzipSize: true, // 收集 gzip 大小并将其显示
        brotliSize: true, // 收集 brotli 大小并将其显示
      })
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
      host: 'localhost',
      port: 8080,
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
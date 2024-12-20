import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import Components from "unplugin-vue-components/vite";
import { ConfigEnv, defineConfig, loadEnv } from "vite";

import { visualizer } from "rollup-plugin-visualizer";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

import os from "os";

export default defineConfig((mode: ConfigEnv) => {
  console.log("mode", mode);
  const env = loadEnv(mode.mode, process.cwd());
  const isProduction = mode.mode === "production";
  return {
    base: "/",
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
    },
    plugins: [
      vue(),
      Components({
        resolvers: [
          ElementPlusResolver({
            importStyle: false,
          }),
        ],
      }),
      visualizer({
        open: false, //注意这里要设置为true，否则无效
        filename: "stats.html", //分析图生成的文件名
        gzipSize: true, // 收集 gzip 大小并将其显示
        brotliSize: true, // 收集 brotli 大小并将其显示
      }),
    ],
    resolve: {
      alias: {
        "@": resolve("./src"),
        "#": resolve("./src/types"),
        utils: resolve("./src/utils"),
        api: resolve("./src/api"),
        public: resolve("./public"),
      },
    },
    define: {
      _VERSION_: JSON.stringify(require("./package.json").version),
      __OS_PLATFORM__: JSON.stringify(os.platform()),
      _OS_RELEASE_: JSON.stringify(os.release()),
      _OS_HOSTNAME_: JSON.stringify(os.hostname()),
    },
    server: {
      host: "0.0.0.0",
      disableHostCheck: true,
      port: 8080,
      proxy: {
        [env.VITE_HTTP_BASE_URL_admin]: {
          target: env.VITE_HTTP_URL_admin,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp("^" + env.VITE_HTTP_BASE_URL_admin), ""),
        },
        [env.VITE_HTTP_URL_FILE]: {
          target: "http://120.79.80.70:8084",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(new RegExp("^" + env.VITE_HTTP_URL_FILE), "");
          },
        },
        "/client-api-120-79-186-23-13556": {
          target: "http://120.79.186.23:13556",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(
              new RegExp("^" + "/client-api-120-79-186-23-13556"),
              ""
            );
          },
        },
        "/client-api-120-79-80-70-8098": {
          target: "http://120.79.80.70:8098",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(
              new RegExp("^" + "/client-api-120-79-80-70-8098"),
              ""
            );
          },
        },
        "/client-api-103-75-0-197-17556": {
          target: "http://103.75.0.197:17556",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(
              new RegExp("^" + "/client-api-103-75-0-197-17556"),
              ""
            );
          },
        },
        "/client-api-103-75-0-197-8098": {
          target: "http://103.75.0.197:8098",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(
              new RegExp("^" + "/client-api-103-75-0-197-8098"),
              ""
            );
          },
        },
        "/client-api": {
          target: "http://120.79.186.23:13556",
          changeOrigin: true,
          rewrite: (path) => {
            return path.replace(new RegExp("^" + "/client-api"), "");
          },
        },
      },
    },
  };
});

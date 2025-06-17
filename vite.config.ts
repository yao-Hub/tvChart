import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import Components from "unplugin-vue-components/vite";
import { ConfigEnv, defineConfig, loadEnv } from "vite";

import { visualizer } from "rollup-plugin-visualizer";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";

import electron from "vite-plugin-electron";

import os from "os";

// @ts-ignore
export default defineConfig((mode: ConfigEnv) => {
  console.log("mode", mode);
  const ifElectron = process.env.IF_ELECTRON;
  const env = loadEnv(mode.mode, process.cwd());
  const isProduction = mode.mode === "production";
  return {
    base: ifElectron ? "./" : "/",
    build: {
      minify: "terser",
      // terserOptions: {
      //   compress: {
      //     drop_console: isProduction,
      //     drop_debugger: isProduction,
      //   },
      // },
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 2000,
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
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        threshold: 10240, // 大于 10KB 的文件才压缩
        filter: /\.(js|css|html|svg|json)$/i, // 指定压缩的文件类型
        deleteOriginFile: false, // 压缩后是否删除原始文件（不建议）
        compressionOptions: { level: 9 }, // 压缩级别 1-9（9 最高）
        verbose: true, // 输出压缩日志
      }),
      visualizer({
        open: false, //注意这里要设置为true，否则无效
        filename: "stats.html", //分析图生成的文件名
        gzipSize: true, // 收集 gzip 大小并将其显示
        brotliSize: true, // 收集 brotli 大小并将其显示
      }),
      ifElectron &&
        electron([
          {
            entry: "electron/main.js",
            onstart({ startup }) {
              // 本地运行完命令直接启动electron程序
              startup();
            },
          },
          {
            entry: "electron/preload.js",
          },
        ]),
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
      "process.env": {
        ...process.env,
      },
      _VERSION_: JSON.stringify(require("./package.json").version),
      WEB_PLATFORM: JSON.stringify(os.platform()), // 系统平台
      WEB_RELEASE: JSON.stringify(os.release()), // 系统版本号
      WEB_HOSTNAME: JSON.stringify(os.hostname()), // 主机名
      OS_TYPE: JSON.stringify(os.type()), // Windows_NT
      OS_MACH: JSON.stringify(os.machine()), // x86_64
    },
    server: {
      host: "0.0.0.0",
      disableHostCheck: true,
      port: 8080,
      proxy: {
        [env.VITE_HTTP_URL_admin]: {
          target: env.VITE_HTTP_URL_admin,
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(new RegExp("^" + env.VITE_HTTP_URL_admin), ""),
        },
      },
    },
  };
});

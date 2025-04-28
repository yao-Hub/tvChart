import typescriptESLintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptESLintParser from "@typescript-eslint/parser";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";

export default [
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parser: typescriptESLintParser,
    },
    plugins: { "@typescript-eslint": typescriptESLintPlugin },
  },
  // pluginJs.configs.recommended,
  // typescriptESLintPlugin.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    rules: {
      // 禁用某个规则
      "no-console": "off",
      // 自定义规则
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
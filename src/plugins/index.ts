import { App } from "vue";

type Plugin = {
  install: (app: App) => void;
};

type PluginModule = {
  default: {
    [key: string]: Plugin;
  };
};

const pluginFiles = import.meta.glob("./*.{js,ts}", { eager: true });
const plugins: Plugin[] = [];

for (const path in pluginFiles) {
  const pluginModule = pluginFiles[path] as PluginModule;
  for (const pluginName in pluginModule.default) {
    plugins.push(pluginModule.default[pluginName]);
  }
}

console.log(plugins);

export default plugins;

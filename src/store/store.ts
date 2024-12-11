import { defineStore, storeToRefs } from "pinia";
import { nextTick } from "vue";
const allActions = {};
const allStates: Record<string, any> = {};
nextTick(async () => {
  const getActions = (
    item: Record<string, Function>,
    states: Record<string, Object>
  ) => {
    const actions: Record<string, Function> = {};
    for (const i in item) {
      if (!/[$_]/.test(i) && !states.hasOwnProperty(i)) {
        actions[i] = item[i];
      }
    }
    return actions;
  };

  const moduleFiles: any = import.meta.glob("./modules/*.ts");
  for (const path in moduleFiles) {
    if (Object.prototype.hasOwnProperty.call(moduleFiles, path)) {
      const modules = await moduleFiles[path]();
      for (const i in modules) {
        const storeItem = modules[i]();
        const states = storeToRefs(storeItem);
        const actions = getActions(storeItem, states);
        Object.assign(allStates, states);
        Object.assign(allActions, actions);
      }
    }
  }
});
export const useRoot = defineStore("root", {
  state: () => allStates,
  actions: allActions,
});

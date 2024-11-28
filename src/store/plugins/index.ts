import "pinia";
import { debounce } from "lodash";
import { PiniaPluginContext } from "pinia";

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    // 任意 action 都允许定义一个防抖的毫秒数
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>;
  }
}

export function debouncePlugin({ options, store }: PiniaPluginContext) {
  if (options.debounce) {
    // 我们正在用新的 action 来覆盖这些 action
    return Object.keys(options.debounce).reduce((debouncedActions, action) => {
      // @ts-ignore
      debouncedActions[action] = debounce(
        store[action],
        // @ts-ignore
        options.debounce[action]
      );
      return debouncedActions;
    }, {});
  }
}

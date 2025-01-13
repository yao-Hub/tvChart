import { debounce, throttle } from "lodash";
import "pinia";
import { PiniaPluginContext } from "pinia";

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    // 任意 action 都允许定义一个防抖的毫秒数
    debounce?: Partial<Record<keyof StoreActions<Store>, number>>;
    throttle?: Partial<Record<keyof StoreActions<Store>, number>>;
  }
}

export function debouncePlugin({ options, store }: PiniaPluginContext) {
  if (options.debounce) {
    return Object.keys(options.debounce).reduce((debouncedActions, action) => {
      debouncedActions[action as keyof typeof debouncedActions] = debounce(
        store[action],
        options.debounce![action]
      );
      return debouncedActions;
    }, {} as Partial<typeof store>);
  }
}

export function throttlePlugin({ options, store }: PiniaPluginContext) {
  if (options.throttle) {
    return Object.keys(options.throttle).reduce((throttledActions, action) => {
      throttledActions[action as keyof typeof throttledActions] = throttle(
        store[action],
        options.throttle![action]
      );
      return throttledActions;
    }, {} as Partial<typeof store>);
  }
}

import { debounce, throttle } from "lodash";
import "pinia";
import { PiniaPluginContext } from "pinia";

declare module "pinia" {
  export interface DefineStoreOptionsBase<S, Store> {
    // 任意 action 都允许定义一个防抖的毫秒数
    debounce?: Partial<
      Record<
        keyof StoreActions<Store>,
        {
          wait: number;
          leading?: boolean;
          maxWait?: number;
          trailing?: boolean;
        }
      >
    >;
    throttle?: Partial<
      Record<
        keyof StoreActions<Store>,
        {
          wait: number;
          leading?: boolean;
          trailing?: boolean;
        }
      >
    >;
  }
}

export function debouncePlugin({ options, store }: PiniaPluginContext) {
  if (options.debounce) {
    return Object.keys(options.debounce).reduce((debouncedActions, funName) => {
      const {
        wait,
        leading = false,
        maxWait = wait,
        trailing = true,
      } = options.debounce![funName]!;
      debouncedActions[funName] = debounce(
        store[funName],
        options.debounce![funName]?.wait,
        {
          leading,
          maxWait,
          trailing,
        }
      );
      return debouncedActions;
    }, {} as Partial<typeof store>);
  }
}

export function throttlePlugin({ options, store }: PiniaPluginContext) {
  if (options.throttle) {
    return Object.keys(options.throttle).reduce((throttledActions, funName) => {
      const {
        wait,
        leading = true,
        trailing = true,
      } = options.throttle![funName]!;
      throttledActions[funName as keyof typeof throttledActions] = throttle(
        store[funName],
        wait,
        {
          leading,
          trailing,
        }
      );
      return throttledActions;
    }, {} as Partial<typeof store>);
  }
}

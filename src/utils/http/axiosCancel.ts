import { CancelTokenSource } from "axios";

// 用于存储取消令牌源的数组
const cancelTokenSources: CancelTokenSource[] = [];

// 添加取消令牌源到数组
export const addCancelTokenSource = (source: CancelTokenSource) => {
  cancelTokenSources.push(source);
};

// 取消所有请求并清空数组
export const cancelAllRequests = () => {
  cancelTokenSources.forEach((source) =>
    source.cancel("Request canceled due to route change")
  );
  cancelTokenSources.length = 0;
};

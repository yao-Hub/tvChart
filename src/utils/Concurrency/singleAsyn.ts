/**
 * 并发方案一
 * 单例异步函数：只执行第一次调用，其余共享结果
 * 只执行第一次的并发，其余的并发等待第一次的返回
 * 适用于需要确保某个异步函数在并发调用时只执行一次的场景
 * @param asyncFn - 需要执行的异步函数
 * @param args - 异步函数的参数
 * @returns 返回一个 Promise，表示异步函数的执行结果
 */
export function createSingletonAsyncFn<Args extends any[], ReturnType>(
  asyncFn: (...args: Args) => Promise<ReturnType>
): (...args: Args) => Promise<ReturnType> {
  // 保存当前执行中的 Promise
  let currentPromise: Promise<ReturnType> | null = null;

  return async function (...args: Args): Promise<ReturnType> {
    // 如果已有进行中的请求，直接返回该 Promise
    if (currentPromise) {
      return currentPromise;
    }

    try {
      // 创建新 Promise 并保存
      currentPromise = asyncFn(...args);
      // 等待异步操作完成
      return await currentPromise;
    } finally {
      // 无论成功失败都重置状态
      currentPromise = null;
    }
  };
}

/**
 * 并发方案二
 * 并发任务调度器
 * 用于控制异步任务的并发执行数量
 * 适用于需要执行全部的异步任务的场景
 *
 * @class SynchronizeTask
 * @template T - 异步任务返回值的类型
 */

class SynchronizeTask<T = any> {
  // 最大并发任务数
  private parallelCount: number;
  // 任务队列（等待执行的任务）
  private taskQueue: Array<{
    task: () => Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
  }>;
  // 当前正在执行的任务数
  private currentTasks: number;

  constructor(parallelCount = 1) {
    this.parallelCount = parallelCount;
    this.taskQueue = [];
    this.currentTasks = 0;
  }

  add(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // 添加任务到队列;
      this.taskQueue.push({ task, resolve, reject });
      // 尝试执行任务
      this._run();
    });
  }

  private _run(): void {
    // 当有可用并发槽（当前任务数小于并发数），且队列中有任务时
    while (
      this.currentTasks < this.parallelCount &&
      this.taskQueue.length > 0
    ) {
      // 从队列头部取出一个任务
      const queueItem = this.taskQueue.shift();
      if (!queueItem) continue;

      // 增加当前任务计数
      this.currentTasks++;
      const { task, resolve, reject } = queueItem;
      task()
        .then(resolve, reject)
        .finally(() => {
          this.currentTasks--;
          this._run(); // 任务完成后继续执行下一个任务
        });
    }
  }
}

export default SynchronizeTask;
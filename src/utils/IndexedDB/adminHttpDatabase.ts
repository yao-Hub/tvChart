import IndexedDBService from "./index";

const dbName = "adminHttpDatabase";
const objectStoreName = "adminStore";

interface IData {
  id: number;
  url: string;
  resData: string;
  reqData: string;
}

// 定义单例实例
let httpIndexedDBServiceInstance: IndexedDBService | null = null;
// 标记数据库是否已初始化
let isDBInitialized = false;

// 初始化数据库并创建单例实例
async function initAdminHttpDB() {
  if (!httpIndexedDBServiceInstance) {
    httpIndexedDBServiceInstance = new IndexedDBService(
      dbName,
      objectStoreName,
      ["url", "reqData"]
    );
    try {
      await httpIndexedDBServiceInstance.openDatabase();
      isDBInitialized = true;
    } catch (error) {
      httpIndexedDBServiceInstance = null;
      isDBInitialized = false;
      throw error;
    }
  }
  return httpIndexedDBServiceInstance;
}

// 创建一个全局锁映射
const lockMap = new Map<string, Promise<void>>();

// 获取锁函数
async function acquireLock(key: string): Promise<() => void> {
  while (lockMap.has(key)) {
    await lockMap.get(key);
  }
  let releaseLock: () => void;
  const lock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  lockMap.set(key, lock);
  return () => {
    lockMap.delete(key);
    releaseLock();
  };
}

// 创建原子更新方法
async function atomicUpsert(
  searchData: { url: string; reqData: string },
  obj: IData
) {
  if (!httpIndexedDBServiceInstance) {
    throw new Error("数据库服务实例未初始化");
  }

  const lockKey = `${searchData.url}_${JSON.stringify(searchData.reqData)}`;
  const release = await acquireLock(lockKey);

  try {
    const stoData = await httpIndexedDBServiceInstance.findByCondition(
      searchData
    );
    if (stoData) {
      await httpIndexedDBServiceInstance.updateData(searchData, obj);
    } else {
      await httpIndexedDBServiceInstance.addData(obj);
    }
  } finally {
    release();
  }
}

// 创建一个代理对象来包装 httpIndexedDBServiceInstance
const proxiedhttpDBService = new Proxy(
  {} as IndexedDBService & { atomicUpsert: typeof atomicUpsert },
  {
    get(target, prop) {
      if (!isDBInitialized) {
        throw new Error(
          "admin 数据库尚未初始化，请先调用 initAdminHttpDB 函数。"
        );
      }
      if (!httpIndexedDBServiceInstance) {
        throw new Error("admin 数据库服务实例未正确初始化。");
      }
      if (prop === "atomicUpsert") {
        return atomicUpsert;
      }
      const originalMethod = Reflect.get(httpIndexedDBServiceInstance, prop);
      return originalMethod;
    },
    set(target, prop, value) {
      if (!isDBInitialized) {
        throw new Error(
          "http 数据库尚未初始化，请先调用 initAdminHttpDB 函数。"
        );
      }
      if (!httpIndexedDBServiceInstance) {
        throw new Error("http 数据库服务实例未正确初始化。");
      }
      return Reflect.set(httpIndexedDBServiceInstance, prop, value);
    },
  }
);

// 导出代理对象、初始化函数
export { proxiedhttpDBService as adminHttpIndexedDB, initAdminHttpDB };

import IndexedDBService from "./index";

const dbName = "logDatabase";
const dbVersion = 1;
const objectStoreName = "logStore";

// 定义单例实例
let logIndexedDBServiceInstance: IndexedDBService | null = null;
// 标记数据库是否已初始化
let isDBInitialized = false;

// 初始化数据库并创建单例实例
async function initLogDB() {
  if (!logIndexedDBServiceInstance) {
    logIndexedDBServiceInstance = new IndexedDBService(
      dbName,
      dbVersion,
      objectStoreName
    );
    try {
      await logIndexedDBServiceInstance.openDatabase();
      console.log("Log 数据库已成功打开");
      isDBInitialized = true;
    } catch (error) {
      console.error("打开 Log 数据库时出错:", error);
      logIndexedDBServiceInstance = null;
      isDBInitialized = false;
      throw error;
    }
  }
  return logIndexedDBServiceInstance;
}

// 创建一个代理对象来包装 logIndexedDBServiceInstance
const proxiedLogDBService = new Proxy({} as IndexedDBService, {
  get(target, prop) {
    if (!isDBInitialized) {
      throw new Error("Log 数据库尚未初始化，请先调用 initLogDB 函数。");
    }
    if (!logIndexedDBServiceInstance) {
      throw new Error("Log 数据库服务实例未正确初始化。");
    }
    return Reflect.get(logIndexedDBServiceInstance, prop);
  },
  set(target, prop, value) {
    if (!isDBInitialized) {
      throw new Error("Log 数据库尚未初始化，请先调用 initLogDB 函数。");
    }
    if (!logIndexedDBServiceInstance) {
      throw new Error("Log 数据库服务实例未正确初始化。");
    }
    return Reflect.set(logIndexedDBServiceInstance, prop, value);
  },
});

// 导出代理对象、初始化函数
export { proxiedLogDBService as logIndexedDB, initLogDB };

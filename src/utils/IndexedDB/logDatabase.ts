import IndexedDBService from "./index";

const dbName = "logDatabase";
const dbVersion = 1;
const objectStoreName = "logStore";

// 定义日志数据的格式接口
interface LogData {
  id: number;
  logType: "info" | "error";
  origin: "network" | "trades" | "audit";
  time: string;
  login: string | number;
  logName: string;
  detail: string;
}

// 验证数据是否符合 LogEntry 格式
function validateLogEntry(data: unknown): data is LogData {
  if (typeof data !== "object" || data === null) return false;
  const entry = data as LogData;
  return (
    typeof entry.id === "number" &&
    typeof entry.time === "string" &&
    typeof entry.logName === "string" &&
    typeof entry.detail === "string" &&
    ["string", "number"].includes(typeof entry.login) &&
    ["info", "error"].includes(entry.logType) &&
    ["network", "trades", "audit"].includes(entry.origin)
  );
}

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
      objectStoreName,
      ["id", "origin", "time", "login", "logType", "day"]
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
    // return Reflect.get(logIndexedDBServiceInstance, prop);
    const originalMethod = Reflect.get(logIndexedDBServiceInstance, prop);

    // 对 addData 和 updateData 方法进行数据验证
    if (prop === "addData" || prop === "updateData") {
      return (data: unknown) => {
        if (!validateLogEntry(data)) {
          throw new Error(`数据格式不符合要求`);
        }
        return originalMethod.call(logIndexedDBServiceInstance, data);
      };
    }

    return originalMethod;
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

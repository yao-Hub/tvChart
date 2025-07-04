import IndexedDBService from "./index";
// import { ResLineInfo } from "api/kline/index";

const dbName = "klineDatabase";
const objectStoreName = "klineStore";

// interface IData {
//   id: string; // 唯一标识符
//   resolute: string; // 周期
//   symbol: string; // 商品名称
//   timeStamp: number; // 时间戳
//   data: ResLineInfo[]; // K线数据
// }

// 定义单例实例
let httpIndexedDBServiceInstance: IndexedDBService | null = null;
// 标记数据库是否已初始化
let isDBInitialized = false;

// 初始化数据库并创建单例实例
async function initKlineDB() {
  if (!httpIndexedDBServiceInstance) {
    httpIndexedDBServiceInstance = new IndexedDBService(
      dbName,
      objectStoreName,
      ["symbol", "timeStamp", "resolute"]
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

// 创建一个代理对象来包装 httpIndexedDBServiceInstance
const proxiedhttpDBService = new Proxy(
  {} as IndexedDBService,
  {
    get(target, prop) {
      if (!isDBInitialized) {
        throw new Error(
          `${dbName} 数据库尚未初始化，请先调用 initKlineDB 函数。`
        );
      }
      if (!httpIndexedDBServiceInstance) {
        throw new Error(`${dbName} 数据库服务实例未正确初始化。`);
      }
      const originalMethod = Reflect.get(httpIndexedDBServiceInstance, prop);
      return originalMethod;
    },
    set(target, prop, value) {
      if (!isDBInitialized) {
        throw new Error(
          "数据库尚未初始化，请先调用 initKlineDB 函数。"
        );
      }
      if (!httpIndexedDBServiceInstance) {
        throw new Error(`${dbName} 数据库服务实例未正确初始化。`);
      }
      return Reflect.set(httpIndexedDBServiceInstance, prop, value);
    },
  }
);

// 导出代理对象、初始化函数
export { proxiedhttpDBService as klineIndexedDB, initKlineDB };

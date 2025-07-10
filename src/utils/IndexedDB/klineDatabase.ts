import IndexedDBService from "./index";
import { RESOLUTES } from "@/constants/common";

class KlineDB {
  private dbName: string; // 数据库名称
  private storeName: string; // 表名称

  // 代理实例
  private proxiedInstanceMap: Record<string, IndexedDBService> = {};

  constructor(dbName: string) {
    this.dbName = dbName;
    this.storeName = "data";
  }

  // 初始化数据库并创建单例实例
  initKlineDB(): Promise<IndexedDBService> {
    return new Promise(async (resolve) => {
      let proxiedInstance = this.proxiedInstanceMap[this.dbName];
      if (proxiedInstance) {
        resolve(this.proxiedInstanceMap[this.dbName]);
      }
      const instance = new IndexedDBService(this.dbName, this.storeName, [
        "ctm",
        "resolution",
      ]);
      await instance.openDatabase();
      this.cleanCache(instance);
      // 代理
      proxiedInstance = new Proxy(instance, {
        get: (target, prop) => {
          // 获取原始方法
          const value = Reflect.get(target, prop);

          // 如果是方法则绑定this上下文
          if (typeof value === "function") {
            return value.bind(target);
          }
          return value;
        },
        set: (target, prop, value) => {
          return Reflect.set(target, prop, value);
        },
      });
      this.proxiedInstanceMap[this.dbName] = proxiedInstance;
      resolve(this.proxiedInstanceMap[this.dbName]);
    });
  }

  // 清除缓存
  async cleanCache(service: IndexedDBService) {
    // 数据保质期
    const dayInterval: Record<string, number> = {
      "1": 15,
      "5": 75,
      "15": 150,
      "30": 365,
      "60": 730,
    };
    const data = await service.getAllData();
    for (const i in RESOLUTES) {
      if (dayInterval[i]) {
        const list = data.filter((e) => e.resolution === i);
        // 清除n天前的数据
        const currentecond = Math.floor(Date.now() / 1000);
        const daysAgo = currentecond - dayInterval[i] * 24 * 60 * 60 * 1000;
        const result = list.filter((item) => item.id <= daysAgo);
        if (result.length) {
          await service.deleteMultipleData(result);
        }
      }
    }
  }
}
export default KlineDB;

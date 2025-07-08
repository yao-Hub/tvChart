import IndexedDBService from "./index";
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
}
export default KlineDB;

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private objectStoreName: string;
  private fields: string[];

  constructor(
    dbName: string,
    dbVersion: number,
    objectStoreName: string,
    fields: string[]
  ) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.objectStoreName = objectStoreName;
    this.fields = fields;
  }

  async openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        reject(
          new Error("数据库打开失败: " + (event.target as IDBRequest).error)
        );
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBRequest).result;
        resolve(this.db as IDBDatabase);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest).result;
        if (!db.objectStoreNames.contains(this.objectStoreName)) {
          const objectStore = db.createObjectStore(this.objectStoreName, {
            keyPath: "id",
          });
          this.fields.forEach((field) => {
            objectStore.createIndex(field, field, { unique: false });
          });
        }
      };
    });
  }

  async closeDatabase() {
    return new Promise<void>((resolve, reject) => {
      if (this.db) {
        try {
          this.db.close();
          this.db = null;
          console.log("数据库已关闭");
          resolve();
        } catch (error) {
          reject(new Error("关闭数据库时出错: " + error));
        }
      } else {
        resolve();
      }
    });
  }

  async addData<T extends { id: number }>(data: T) {
    if (!this.db) {
      throw new Error("数据库未打开");
    }
    return new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.add(data);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as number);
      };

      request.onerror = (event) => {
        reject(
          new Error("数据添加失败: " + (event.target as IDBRequest).error)
        );
      };
    });
  }

  async updateData<T extends { id: number }>(data: T) {
    if (!this.db) {
      throw new Error("数据库未打开");
    }
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.put(data);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(
          new Error("数据更新失败: " + (event.target as IDBRequest).error)
        );
      };
    });
  }

  async deleteData(id: number) {
    if (!this.db) {
      throw new Error("数据库未打开");
    }
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(
          new Error("数据删除失败: " + (event.target as IDBRequest).error)
        );
      };
    });
  }

  // 获取对象存储空间中的所有数据
  async getAllData() {
    if (!this.db) {
      throw new Error("数据库未打开");
    }
    try {
      // 开启一个只读事务
      const transaction = this.db.transaction(
        [this.objectStoreName],
        "readonly"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);

      // 获取所有数据
      const request = objectStore.getAll();

      return new Promise((resolve, reject) => {
        // 数据获取成功
        request.onsuccess = (event) => {
          const target = event.target as IDBRequest;
          if (target) {
            resolve(target.result || []);
            return;
          }
          resolve([]);
        };

        // 数据获取失败
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async optimizedFilter(conditions: Object): Promise<Object[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        throw new Error("数据库未打开");
      }
      const transaction = this.db.transaction(this.objectStoreName, "readonly");
      const store = transaction.objectStore(this.objectStoreName);

      // 获取第一个有效条件和索引
      const [firstKey, firstValue] =
        Object.entries(conditions).find(([_, v]) => v !== undefined) || [];

      if (!firstKey) {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        return;
      }

      const index = store.index(firstKey);
      const request = index.getAll(IDBKeyRange.only(firstValue));

      request.onsuccess = () => {
        const filtered = request.result.filter((log) =>
          Object.entries(conditions).every(
            ([key, value]) => value === undefined || log[key] === value
          )
        );
        resolve(filtered);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export default IndexedDBService;

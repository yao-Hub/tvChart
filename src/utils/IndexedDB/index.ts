class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private objectStoreName: string;
  private fields: string[];

  constructor(dbName: string, objectStoreName: string, fields: string[]) {
    this.dbName = dbName;
    this.objectStoreName = objectStoreName;
    this.fields = fields;

    let version = 1;
    // @ts-ignore
    const systemVersion = _VERSION_;
    if (systemVersion) {
      version = +systemVersion.split(".").join("");
    }
    this.dbVersion = version;
  }

  async openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        reject(
          new Error("数据库打开失败: " + (event.target as IDBRequest).error)
        );
      };

      // 成功打开
      request.onsuccess = (event) => {
        this.db = (event.target as IDBRequest).result;
        this.checkStorageQuota();
        resolve(this.db as IDBDatabase);
      };

      // indexedDB版本更新
      request.onupgradeneeded = (event) => {
        const target = event.target as IDBRequest;
        const db = target.result;
        const obName = this.objectStoreName;
        let objectStore: IDBObjectStore;
        if (!db.objectStoreNames.contains(obName)) {
          objectStore = db.createObjectStore(obName, {
            keyPath: "id",
          });
        }
        // 获取已存在的对象存储
        objectStore = target.transaction!.objectStore(obName);

        // 增加索引
        this.fields.forEach((field) => {
          if (!objectStore.indexNames.contains(field)) {
            objectStore.createIndex(field, field, { unique: false });
          }
        });
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

      request.onerror = async (event) => {
        const error = (event.target as IDBRequest).error;
        // 存储空间已满
        if (error?.name === "QuotaExceededError") {
          try {
            await this.deleteOldData();
            // 重试添加
            const retryResult = await this.addData(data);
            resolve(retryResult);
          } catch (deleteError) {
            reject(deleteError);
          }
        } else {
          reject(new Error("数据添加失败: " + error));
        }
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

  // 查找（筛选过滤）数据
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

  // 删除最早30天的数据
  private async deleteOldData(): Promise<void> {
    if (!this.db) {
      throw new Error("数据库未打开");
    }

    const delDays = 30;

    // 获取最小id（最早时间戳）
    const minId = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readonly"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      // openCursor：游标，异步
      // null：表示不限制范围，遍历所有数据。
      // 'next'：按升序遍历，确保获取到最小的 id。
      const request = objectStore.openCursor(null, "next");

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          resolve(cursor.value.id);
        } else {
          reject(new Error("没有数据可删除"));
        }
      };

      request.onerror = (event) => {
        reject(
          new Error("无法获取最早数据: " + (event.target as IDBRequest).error)
        );
      };
    });

    // 计算当天起始和结束时间戳
    const date = new Date(minId);
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime();
    const endOfDay = startOfDay + 24 * delDays * 60 * 60 * 1000 - 1;

    // 删除该日期内的所有数据
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      // 创建一个 范围查询
      const range = IDBKeyRange.bound(startOfDay, endOfDay);
      const request = objectStore.delete(range);

      request.onsuccess = () => {
        console.log("过期数据已清理");
        resolve();
      };
      request.onerror = (event) =>
        reject(
          new Error("删除旧数据失败: " + (event.target as IDBRequest).error)
        );
    });
  }

  // 检查是否超出空间
  private async checkStorageQuota() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const { usage, quota } = await navigator.storage.estimate();
        if (usage && quota) {
          console.log(`已使用空间: ${usage} bytes`);
          console.log(`总可用空间: ${quota} bytes`);
          console.log(`使用比例: ${((usage / quota) * 100).toFixed(2)}%`);
          if (usage / quota > 0.9) {
            console.log("存储空间即将用尽，清理数据！");
            this.deleteOldData();
          }
        }
      } else {
        console.warn("当前浏览器不支持Storage Manager API");
      }
    } catch (error) {
      console.error("获取存储信息失败:", error);
    }
  }
}

export default IndexedDBService;

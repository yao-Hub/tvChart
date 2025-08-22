class IndexedDBService {
  private db: IDBDatabase | null = null; // 数据库实例
  private dbName: string; // 数据库名称
  private dbVersion: number; // 数据库版本
  private objectStoreName: string; // 对象仓库名称
  private fields: string[]; // 字段
  private backup: any[] = []; // 备份数据

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

  openDatabase(isRetry = false) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      // 成功打开
      request.onsuccess = async (event) => {
        console.log("数据库成功打开", this.dbName, this.objectStoreName);
        const target = event.target as IDBRequest;
        this.db = target.result;

        // 备份数据写入
        if (this.backup.length) {
          await this.restoreData();
        }
        await this.checkStorageQuota();
        resolve(this.db);
      };

      request.onerror = async (event) => {
        const error = (event.target as IDBRequest).error;
        // 版本过低错误处理
        if (error && error.name === "VersionError" && !isRetry) {
          console.warn("数据库版本过低，尝试迁移数据...");
          // 1. 备份旧数据
          this.backup = await this.backupOldData();

          // 2. 删除旧数据库
          await this.deleteOldDatabase();

          // 3. 重新打开新数据库并恢复数据
          console.log("创建新数据库并恢复数据", this.dbName);
          const newDb = await this.openDatabase(true);
          resolve(newDb);
        } else {
          console.error("数据库打开失败:", error);
          reject();
        }
      };

      // indexedDB首次创建或者版本变化
      request.onupgradeneeded = (event) => {
        console.log("版本更新", this.dbName);
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

  // 获取备份
  private backupOldData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const oldDbRequest = indexedDB.open(this.dbName);

      oldDbRequest.onsuccess = (event) => {
        const db = (event.target as IDBRequest).result;
        const tx = db.transaction(this.objectStoreName, "readonly");
        const store = tx.objectStore(this.objectStoreName);
        const request = store.getAll();

        request.onsuccess = () => {
          console.log("备份成功", this.dbName);
          db.close(); // 及时关闭旧连接
          resolve(request.result);
        };

        request.onerror = () => reject(request.error);
      };

      oldDbRequest.onerror = (event) => {
        console.error(
          "旧数据库访问失败: " + (event.target as IDBRequest).error
        );
        reject();
      };
    });
  }

  // 数据恢复
  private restoreData(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error("restoreData -> 数据库未打开", this.dbName);
        reject();
      }

      const tx = this.db!.transaction(this.objectStoreName, "readwrite");
      const store = tx.objectStore(this.objectStoreName);
      this.backup.forEach((item) => store.put(item));

      tx.oncomplete = () => {
        console.log(`${this.dbName} 成功恢复 ${this.backup.length} 条数据`);
        this.backup = [];
        resolve();
      };

      tx.onerror = () => reject(tx.error);
    });
  }

  // 删除旧数据库
  deleteOldDatabase(retry = 3): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);

      deleteRequest.onsuccess = () => {
        console.log("旧数据库已删除", this.dbName);
        resolve();
      };
      deleteRequest.onerror = () => {
        console.error(this.dbName + "数据库删除失败: " + deleteRequest.error);
        reject();
      };
      deleteRequest.onblocked = (event) => {
        this.db?.close();
        console.log(`旧数据库${this.dbName}删除被阻止`);
      };
    });
  }

  // 关闭当前数据库
  closeDatabase() {
    return new Promise<void>((resolve, reject) => {
      if (this.db) {
        try {
          this.db.close();
          this.db = null;
          console.log("数据库已关闭", this.dbName);
          resolve();
        } catch (error) {
          console.error(this.dbName, "关闭数据库时出错: ", error);
          reject();
        }
      } else {
        resolve();
      }
    });
  }

  // 数据库添加数据
  addData<T extends { id: number | string; }>(data: T) {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("addData -> 数据库未打开", this.dbName);
        reject();
      }
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.add(data);

      request.onsuccess = () => resolve();

      request.onerror = async (event) => {
        const error = (event.target as IDBRequest).error;
        // 存在相同的key
        if (error?.name === "ConstraintError") {
          await this.updateData(null, data);
          resolve();
        }
        // 存储空间已满
        if (error?.name === "QuotaExceededError") {
          try {
            await this.deleteOldData();
            // 重试添加
            await this.addData(data);
            resolve();
          } catch (deleteError) {
            reject();
          }
        }
        console.error("数据添加失败", error);
        reject();
      };
    });
  }

  // 批量添加数据
  addMultipleData<T extends { id: number | string; }>(data: T[]) {
    return new Promise<void>(async (resolve, reject) => {
      if (!this.db) {
        console.error("addData -> 数据库未打开", this.dbName);
        reject();
      }
      const allData = await this.getAllData();
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      let successAddList = [];
      data.forEach((item) => {
        const index = allData.findIndex((e) => e.id === item.id);
        if (index === -1) {
          objectStore.add(item);
          successAddList.push(item);
        }
      });
      transaction.oncomplete = () => {
        resolve();
        if (successAddList.length > 0) {
          console.log(`${successAddList.length}条数据添加成功`, this.dbName);
        }
      };

      transaction.onerror = (event) => {
        reject();
        console.error("批量添加数据失败:", (event.target as IDBRequest).error);
      };
    });
  }

  // 更新数据
  updateData<T extends { id: number | string; }>(
    condition: Record<string, string | number> | null,
    stoData: T
  ) {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("updateData -> 数据库未打开:", this.dbName);
        reject();
      }
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value;
          let match = true;

          // 检查记录是否匹配条件
          if (condition === null) {
            condition = { id: stoData.id };
          }
          for (const key in condition) {
            if (record[key] !== condition[key]) {
              match = false;
              break; // 发现不匹配立即退出
            }
          }
          // 如果全部匹配则更新记录
          if (match) {
            // 执行更新
            cursor.update({
              ...stoData,
              id: record.id,
            });
            resolve();
          } else {
            cursor.continue();
          }
        }
      };

      transaction.onerror = (event) => {
        console.error("更新事务失败: " + (event.target as IDBRequest).error);
      };
    });
  }

  // 精确查找数据
  findByCondition(condition: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error("findByCondition -> 数据库未打开", this.dbName);
        reject();
      }

      const transaction = this.db!.transaction(
        this.objectStoreName,
        "readonly"
      );
      const store = transaction.objectStore(this.objectStoreName);
      const request = store.openCursor();
      const results: any[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value;
          let match = true;

          // 严格检查所有条件
          for (const key in condition) {
            if (record[key] !== condition[key]) {
              match = false;
              break;
            }
          }

          if (match) results.push(record);
          cursor.continue();
        } else {
          // 返回匹配记录
          resolve(results.length ? results : null);
        }
      };

      request.onerror = (event) => {
        console.error("查找数据失败: " + (event.target as IDBRequest).error);
        resolve(null);
      };
    });
  }

  // 删除一条数据
  deleteData(id: number | string) {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        console.error("deleteData -> 数据库未打开", this.dbName);
        reject();
      }
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
        console.error("数据删除失败: " + (event.target as IDBRequest).error);
        reject();
      };
    });
  }

  // 删除某个范围的数据
  deleteBoundData(startOfDay: number, endOfDay: number) {
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      // 创建一个 范围查询
      const range = IDBKeyRange.bound(startOfDay, endOfDay);
      const request = objectStore.delete(range);

      request.onsuccess = () => {
        console.log(`${this.db} 旧数据已清理: ${startOfDay} - ${endOfDay}`);
        resolve();
      };
      request.onerror = (event) => {
        console.error(
          `${this.db} 删除旧数据失败:`,
          (event.target as IDBRequest).error
        );
        reject();
      };
    });
  }

  // 批量删除数据
  deleteMultipleData<T extends { id: number | string; }>(data: T[]) {
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readwrite"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      data.forEach((item) => {
        objectStore.delete(item.id);
      });
      transaction.oncomplete = () => {
        resolve();
        console.log("批量数据删除成功", this.dbName);
      };

      transaction.onerror = (event) => {
        reject();
        console.error("批量删除数据失败:", (event.target as IDBRequest).error);
      };
    });
  }

  // 获取对象存储空间中的所有数据
  getAllData(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.db) {
          resolve([]);
          return;
        }
        // 开启一个只读事务
        const transaction = this.db.transaction(
          [this.objectStoreName],
          "readonly"
        );
        const objectStore = transaction.objectStore(this.objectStoreName);

        // 获取所有数据
        const request = objectStore.getAll();
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
      } catch (error) {
        reject(error);
      }
    });
  }

  // 查找（筛选过滤）数据
  optimizedFilter(conditions: Object): Promise<Object[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        console.error("optimizedFilter -> 数据库未打开", this.dbName);
        reject();
      }
      const transaction = this.db!.transaction(
        this.objectStoreName,
        "readonly"
      );
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
      console.error("deleteOldData -> 数据库未打开", this.dbName);
      return;
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
          console.warn("没有数据可删除");
          reject();
        }
      };

      request.onerror = (event) => {
        console.error(
          "无法获取最早数据: " + (event.target as IDBRequest).error
        );
        reject();
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
    await this.deleteBoundData(startOfDay, endOfDay);
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
          if (usage / quota > 0.6) {
            console.log("存储空间即将用尽，清理数据！");
            await this.deleteOldData();
          }
        }
      } else {
        console.warn("当前浏览器不支持Storage Manager API");
      }
    } catch (error) {
      console.error(this.dbName + "获取存储信息失败:", error);
    }
  }
}

export default IndexedDBService;

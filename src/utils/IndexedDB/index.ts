class IndexedDBService {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private objectStoreName: string;

  constructor(dbName: string, dbVersion: number, objectStoreName: string) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
    this.objectStoreName = objectStoreName;
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
          objectStore.createIndex("nameIndex", "name", { unique: false });
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

  async getDataById(id: number) {
    if (!this.db) {
      throw new Error("数据库未打开");
    }
    return new Promise<{ id: number } | null>((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.objectStoreName],
        "readonly"
      );
      const objectStore = transaction.objectStore(this.objectStoreName);
      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result as { id: number } | null);
      };

      request.onerror = (event) => {
        reject(
          new Error("数据查询失败: " + (event.target as IDBRequest).error)
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
}

export default IndexedDBService;

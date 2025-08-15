<template>
  <div class="clearCache" @click="handleClearCache">
    <BaseImg class="logo" iconName="icon_20" />
    <span>{{ t("clearCache") }}</span>
    <el-icon class="is-loading" v-if="loading"><Loading /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import { useStorage } from "@/store/modules/storage";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import { logIndexedDB } from "utils/IndexedDB/logDatabase";
import { serviceMap } from "@/config/chartConfig";
import { ref } from "vue";
import { useSymbols } from "@/store/modules/symbols";

const { t } = useI18n();

const loading = ref(false);
const closeDatabase = (dbName: string) => {
  return new Promise<void>((resolve) => {
    const request = indexedDB.open(dbName);
    request.onsuccess = (event) => {
      const db = (event.target as IDBRequest).result;
      db.close();
      resolve();
    };
    request.onerror = () => {
      resolve();
    };
  });
};
const deleteDatabase = (dbName: string, retry = 3) => {
  return new Promise<void>((resolve, reject) => {
    if (retry <= 0) {
      reject(new Error(`删除旧数据库失败，已重试 ${retry} 次`));
      return;
    }
    const deleteRequest = indexedDB.deleteDatabase(dbName);
    deleteRequest.onsuccess = () => {
      console.log("旧数据库已删除", dbName);
      resolve();
    };
    deleteRequest.onerror = () => {
      console.error(dbName + "数据库删除失败: " + deleteRequest.error);
      resolve();
    };
    deleteRequest.onblocked = () => {
      console.log(dbName, "旧数据库删除被阻止");
      closeDatabase(dbName);
      deleteDatabase(dbName, retry - 1);
    };
  });
};

const handleClearCache = async () => {
  const login = useUser().account.login;
  const server = useUser().account.server;
  const logData = {
    id: new Date().getTime(),
    time: dayjs().format("HH:mm:ss.SSS"),
    day: dayjs().format("YYYY.MM.DD"),
    origin: "audit",
    logType: "info",
    login,
    server,
    logName: "clearCache",
    detail: `${login}: clearCache (dc: ${useNetwork().nodeName})`,
  };
  loading.value = true;

  // 删除品种indexedDB缓存
  const symbols = useSymbols().symbols;
  const databases = await indexedDB.databases();
  // 删除当前打开的数据库
  for (const i in serviceMap) {
    await serviceMap[i].deleteOldDatabase();
  }
  const serviceSymbols = Object.keys(serviceMap);
  for (let index = 0; index < databases.length; index++) {
    const name = databases[index].name;
    if (name && serviceSymbols.indexOf(name) > -1) {
      continue;
    }
    const tab = symbols.find((e) => e.symbol === name);
    if (tab) {
      const ifDeleted = Object.keys(serviceMap).includes(tab.symbol);
      if (!ifDeleted) {
        await deleteDatabase(tab.symbol);
      }
    }
  }

  // 添加本地日志
  await logIndexedDB.addData(logData);

  // 删除本地用户数据
  useStorage().removeNowUserStorage();

  loading.value = false;

  location.reload();
};
</script>

<style lang="scss" scoped>
.clearCache {
  display: flex;
  gap: 5px;
  align-items: center;
  width: 100%;
}
.is-loading {
  margin-left: auto;
}
</style>

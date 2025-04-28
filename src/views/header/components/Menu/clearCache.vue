<template>
  <div class="clearCache" @click="handleClearCache">
    <BaseImg class="logo" iconName="icon_20" />
    <span>{{ t("clearCache") }}</span>
    <el-icon class="loading" v-if="loading"><Loading /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import { useStorage } from "@/store/modules/storage";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import { logIndexedDB } from "utils/IndexedDB/logDatabase";
import { ref } from "vue";

const { t } = useI18n();

const loading = ref(false);

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
  await logIndexedDB.addData(logData);
  useStorage().removeNowUserStorage();
  loading.value = false;
};
</script>

<style lang="scss" scoped>
.clearCache {
  display: flex;
  gap: 5px;
  align-items: center;
  width: 100%;
}
.loading {
  margin-left: auto;
}
</style>

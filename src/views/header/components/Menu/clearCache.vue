<template>
  <div class="clearCache" @click="handleClearCache">
    <BaseImg class="logo" iconName="icon_20" />
    <span>{{ t("clearCache") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import dayjs from "dayjs";

import { useStorage } from "@/store/modules/storage";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import { logIndexedDB } from "utils/IndexedDB/logDatabase";

const { t } = useI18n();

const handleClearCache = async () => {
  const login = useUser().account.login;
  const logData = {
    id: new Date().getTime(),
    time: dayjs().format("HH:mm:ss.SSS"),
    day: dayjs().format("YYYY.MM.DD"),
    origin: "audit",
    logType: "info",
    login,
    logName: "clearCache",
    detail: `${login}: clearCache (dc: ${useNetwork().nodeName})`,
  };
  await logIndexedDB.addData(logData);
  useStorage().removeNowUserStorage();
};
</script>

<style lang="scss" scoped>
.clearCache {
  display: flex;
  gap: 5px;
}
</style>

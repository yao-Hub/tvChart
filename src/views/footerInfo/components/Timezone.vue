<template>
  <div class="Timezone">
    <el-dropdown trigger="click" placement="top-start">
      <div class="face">
        <span>{{ t("nowTime") }}：{{ currentTimezone }}</span>
        <BaseImg iconName="caretUp" />
      </div>
      <template #dropdown>
        <el-scrollbar height="200px">
          <div
            v-for="item in timezoneOptions"
            :key="item.id"
            class="item"
            @click="changeTimezone(item)"
          >
            <span>{{ item.title }}</span>
            <BaseImg iconName="select" v-if="item.title === currentTimezone" />
          </div>
        </el-scrollbar>
      </template>
    </el-dropdown>

    <span>{{ nowTime }}</span>
  </div>
</template>

<script lang="ts" setup>
import { ITimezone, timezoneOptions } from "@/constants/timezone";
import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

dayjs.extend(timezone);

const timeStore = useTime();

const currentTimezone = computed(() => {
  const guess = timeStore.settedTimezone;
  return timezoneOptions.find((e) => e.id === guess)?.title;
});

const changeTimezone = (info: ITimezone) => {
  timeStore.setSystemTimezone(info.id);
};

const timeFormat = "YYYY.MM.DD HH:mm:ss";
const nowTime = ref(dayjs().tz(timeStore.settedTimezone).format(timeFormat));

const timer = ref();
onMounted(() => {
  timer.value = setInterval(() => {
    nowTime.value = dayjs().tz(timeStore.settedTimezone).format(timeFormat);
  }, 1000);
});
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.Timezone {
  display: flex;
  align-items: center;
  gap: 8px;
}
.face {
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
}
.item {
  width: 120px;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    @include background_color("background-hover");
  }
  &:active {
    @include background_color("background-active");
  }
}
</style>

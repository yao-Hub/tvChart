<template>
  <el-dropdown trigger="click" placement="top-start">
    <div class="timezone">
      <span>当前时区：{{ currentTimezone }}</span>
      <img src="@/assets/icons/caretUp.svg" />
    </div>
    <template #dropdown>
      <el-scrollbar height="200px">
        <div
          v-for="item in timezoneOptions"
          :key="item.id"
          class="timezone_item"
          @click="changeTimezone(item)"
        >
          <span>{{ item.title }}</span>
          <img
            src="@/assets/icons/select.svg"
            v-if="item.title === currentTimezone"
          />
        </div>
      </el-scrollbar>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { timezoneOptions, ITimezone } from "@/constants/timezone";

import { useTime } from "@/store/modules/time";
const timeStore = useTime();

const currentTimezone = computed(() => {
  const guess = timeStore.settedTimezone;
  return timezoneOptions.find((e) => e.id === guess)?.title;
});

const changeTimezone = (info: ITimezone) => {
  timeStore.setTimezone(info.id);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.timezone {
  display: flex;
  gap: 4px;
  align-items: center;
  cursor: pointer;
}
.timezone_item {
  width: 120px;
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    @include background_color("background");
  }
}
</style>

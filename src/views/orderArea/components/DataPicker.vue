<template>
  <div class="timeSelect">
    <span class="label">
      <slot></slot>
    </span>
    <el-date-picker
      v-model="model"
      type="date"
      placeholder="Pick a day"
      :format="dateFormat"
    />
    <BaseImg iconName="caretDown" />
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { onMounted, watch } from "vue";

import { useTime } from "@/store/modules/time";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const timeStore = useTime();
const dateFormat = "YYYY.MM.DD";
const emit = defineEmits(["timeChange"]);

const model = defineModel<string>("value", { default: "" });

const initTime = () => {
  model.value = dayjs().tz(timeStore.settedTimezone).format(dateFormat);
};

onMounted(() => {
  initTime();
});

watch(
  () => model.value,
  () => {
    emit("timeChange");
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.label {
  white-space: nowrap;
  word-break: break-all;
}
.timeSelect {
  height: fit-content;
  display: flex;
  align-items: center;
  border-radius: 4px;
  border: 1px solid;
  @include border_color("border");
  padding: 0 8px;
  &:hover {
    border-color: var(--el-border-color-hover);
  }
}
:deep(.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
  width: 320px;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: none;
}
:deep(.el-icon:first-child) {
  width: 0;
}
</style>

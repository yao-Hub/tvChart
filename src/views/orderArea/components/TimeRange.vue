<template>
  <div class="timeSelect">
    <span class="label">
      <slot></slot>
    </span>
    <el-date-picker
      v-model="model"
      type="datetimerange"
      :shortcuts="shortcuts"
      v-bind="props.pickerOption"
      :value-format="dateFormat"
      :default-time="defaultTime"
      @clear="model = []"
    />
    <BaseImg iconName="caretDown" />
  </div>
</template>

<script setup lang="ts">
import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const timeStore = useTime();
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
interface Props {
  pickerOption?: object;
}

type TTime = Array<string>;

const dateFormat = "YYYY-MM-DD HH:mm:ss";
const props = defineProps<Props>();
const emit = defineEmits(["timeChange"]);

const model = defineModel<TTime>("value", { default: () => [] });

const defaultTime: [Date, Date] = [
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59),
]; // '00:00:00', '23:59:59'

const nowTZ = computed(() => {
  return timeStore.settedTimezone;
});
const shortcuts = computed(() => [
  {
    text: t("time.thisWeek"),
    value: () => {
      return [
        dayjs().tz(nowTZ.value).startOf("week"),
        dayjs().tz(nowTZ.value).format(dateFormat),
      ];
    },
  },
  {
    text: t("time.thisMonth"),
    value: () => {
      return [
        dayjs().tz(nowTZ.value).startOf("month").format(dateFormat),
        dayjs().tz(nowTZ.value).format(dateFormat),
      ];
    },
  },
  {
    text: t("time.thisYear"),
    value: () => {
      return [
        dayjs().tz(nowTZ.value).startOf("year").format(dateFormat),
        dayjs().tz(nowTZ.value).format(dateFormat),
      ];
    },
  },
]);

watch(
  () => model.value,
  () => {
    emit("timeChange");
  },
  { deep: true }
);

// watch(
//   () => nowTZ.value,
//   () => {
//     const [st, et] = model.value;
//     if (st && et) {
//       const startDate = dayjs(st).tz(nowTZ.value).format(dateFormat);
//       const endDate = dayjs(et).tz(nowTZ.value).format(dateFormat);
//       model.value = [startDate, endDate];
//       console.log(et, endDate);
//     }
//   }
// );
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
:deep(.el-date-editor.el-input__wrapper) {
  box-shadow: none;
  padding: 0;
  width: 320px;
}
:deep(.el-icon:first-child) {
  width: 0;
}
:deep(.el-date-editor .el-range-input) {
  width: 50%;
}
</style>

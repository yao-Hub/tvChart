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
      @change="timeChange"
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

import { computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const timeStore = useTime();
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
interface Props {
  initFill?: boolean;
  pickerOption?: object;
}

type TTime = Array<string>;

const dateFormat = "YYYY-MM-DD HH:mm:ss";
const props = defineProps<Props>();
const emit = defineEmits(["timeChange"]);

const model = defineModel<TTime>("value", { default: () => [] });

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

const initializeTimeRange = async () => {
  if (props.initFill) {
    const monday = dayjs()
      .startOf("week")
      .startOf("day")
      .tz(nowTZ.value)
      .format(dateFormat); // 当前周一的日期
    const today = dayjs().tz(nowTZ.value).format(dateFormat);
    model.value = [monday, today];
    // currentData.value = [monday, today];
  }
};

const timeChange = (value: string[]) => {
  // currentData.value = value || [];
};

onMounted(() => {
  initializeTimeRange();
});

watch(
  () => model.value,
  () => {
    emit("timeChange");
  }
);

// 缓存时间 用户操作组件的时间;
// const currentData = ref<string[]>([]);
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
//   },
//   {
//     immediate: true,
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
    @include border_color("primary");
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

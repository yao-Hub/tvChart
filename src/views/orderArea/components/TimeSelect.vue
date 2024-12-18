<template>
  <div class="timeSelect">
    <span class="label">
      <slot></slot>
    </span>
    <el-date-picker
      v-model="timeRange"
      type="datetimerange"
      :shortcuts="shortcuts"
      v-bind="props.pickerOption"
      @change="timeChange"
    />
    <BaseImg iconName="caretDown" />
  </div>
</template>

<script setup lang="ts">
import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const timeStore = useTime();

const timezone = timeStore.settedTimezone;

const shortcuts = [
  {
    text: t("time.thisWeek"),
    value: () => {
      return [dayjs().tz(timezone).startOf("week"), dayjs()];
    },
  },
  {
    text: t("time.thisMonth"),
    value: () => {
      return [dayjs().tz(timezone).startOf("month"), dayjs()];
    },
  },
  {
    text: t("time.thisYear"),
    value: () => {
      return [dayjs().tz(timezone).startOf("year"), dayjs()];
    },
  },
];
dayjs.extend(relativeTime);

interface Props {
  initFill?: boolean;
  pickerOption?: object;
}

const props = defineProps<Props>();

const dateFormat = "YYYY-MM-DD HH:mm:ss";
const timeRange = ref<string[]>([]);
const model = defineModel<any[]>("value");

const initializeTimeRange = async () => {
  if (props.initFill) {
    const monday = dayjs()
      .tz(timezone)
      .startOf("week")
      .startOf("day")
      .format(dateFormat); // 当前周一的日期
    const today = dayjs().tz(timezone).format(dateFormat);
    model.value = [monday, today];
    timeRange.value = [monday, today];
    emit("timeRange");
  }
};
onMounted(() => {
  initializeTimeRange();
});

const emit = defineEmits(["timeRange"]);

const timeChange = (value: any) => {
  if (value !== null) {
    const [st, et] = value;
    const startDate = dayjs(st).tz(timezone).format(dateFormat);
    const endDate = dayjs(et).tz(timezone).format(dateFormat);
    model.value = [startDate, endDate];
  } else {
    model.value = [];
  }
  emit("timeRange");
};
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

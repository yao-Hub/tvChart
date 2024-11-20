<template>
  <div class="timeSelect">
    <span style="font-size: 12px">
      <slot></slot>
    </span>
    <el-date-picker
      style="height: 30px"
      v-model="timeRange"
      type="datetimerange"
      :shortcuts="shortcuts"
      v-bind="props.pickerOption"
      @change="timeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import dayjs from "dayjs";

const shortcuts = [
  {
    text: "本周",
    value: () => {
      return [dayjs().startOf("week"), dayjs()];
    },
  },
  {
    text: "本月",
    value: () => {
      return [dayjs().startOf("month"), dayjs()];
    },
  },
  {
    text: "今年",
    value: () => {
      return [dayjs().startOf("year"), dayjs()];
    },
  },
];
import relativeTime from "dayjs/plugin/relativeTime";
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
    const monday = dayjs().startOf("week").startOf("day").format(dateFormat); // 当前周一的日期
    const today = dayjs().format(dateFormat);
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
    const startDate = dayjs(st).format(dateFormat);
    const endDate = dayjs(et).format(dateFormat);
    model.value = [startDate, endDate];
  } else {
    model.value = [];
  }
  emit("timeRange");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.timeSelect {
  border-radius: 4px;
  border: 1px solid;
  @include border_color("border");
  padding-left: 8px;
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

<template>
  <div>
    <slot></slot>
    <a-range-picker
      v-model:value="timeRange"
      :format="dateFormat"
      :disabledDate="disabledDate"
      :show-time="{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }"
      @change="timeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const dateFormat = "YYYY-MM-DD HH:mm:ss";

interface Props {
  initFill?: boolean;
}

const props = defineProps<Props>();

const model = defineModel();

type RangeValue = [Dayjs, Dayjs];
const timeRange = ref<RangeValue>();

const initializeTimeRange = async () => {
  if (props.initFill) {
    const monday = dayjs().startOf("week").startOf("day"); // 当前周一的日期
    const today = dayjs();
    timeRange.value = [monday, today];
    model.value = [monday, today];
    emit("timeRange", [monday, today]);
  }
};
onMounted(() => {
  initializeTimeRange();
});

const emit = defineEmits(["timeRange"]);

const timeChange = (date: Dayjs | string, dateString: string[]) => {
  emit("timeRange", dateString);
  model.value = dateString;
};
const disabledDate = (current: Dayjs) => {
  return current && current > dayjs().endOf("day");
};
</script>

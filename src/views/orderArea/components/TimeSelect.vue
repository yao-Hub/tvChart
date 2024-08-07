<template>
  <div>
    <slot></slot>
    <a-range-picker
      style="width: 350px;"
      v-model:value="timeRange"
      :format="dateFormat"
      :disabledDate="disabledDate"
      :show-time="{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }"
      :presets="rangePresets"
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
const rangePresets = ref([
  { label: '本周', value: [ dayjs().startOf('week'), dayjs().endOf('week') ] },
  { label: '本月', value: [ dayjs().startOf('month'), dayjs().endOf('month') ] },
  { label: '今年', value: [ dayjs().startOf('year'), dayjs().endOf('year') ] },
]);

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

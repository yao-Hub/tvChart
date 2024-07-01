<template>
  <div>
    <slot></slot>
    <a-range-picker v-model:value="timeRange" :format="dateFormat" :disabledDate="disabledDate" :show-time="{ defaultValue: dayjs('00:00:00', 'HH:mm:ss') }"/>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const dateFormat = 'YYYY-MM-DD HH:mm:ss';

type RangeValue = [Dayjs, Dayjs];
const timeRange = ref<RangeValue>();

const initializeTimeRange = () => {
  const monday = dayjs().startOf('week').startOf('day');  // 当前周一的日期
  const today = dayjs();  // 当天的结束时间（23:59:59）
  timeRange.value = [monday, today];
}
initializeTimeRange();

const emit = defineEmits([ 'timeRange' ]);
watchEffect(() => {
  if (timeRange.value) {
    const [startDay, endDay] = timeRange.value;
    emit('timeRange', [ dayjs(startDay).format(dateFormat), dayjs(endDay).format(dateFormat) ]);
  } else {
    emit('timeRange', ['', ''])
  }
});
// const range = (start: number, end: number) => {
//   const result = [];
//   for (let i = start; i < end; i++) {
//     result.push(i);
//   }
//   return result;
// };

// const disabledRangeTime = (_: Dayjs, type: 'start' | 'end') => {
//   if (type === 'start') {
//     return {
//       disabledHours: () => range(0, 60).splice(4, 20),
//       disabledMinutes: () => range(30, 60),
//       disabledSeconds: () => [55, 56],
//     };
//   }
//   return {
//     disabledHours: () => range(0, 60).splice(20, 4),
//     disabledMinutes: () => range(30, 60),
//     disabledSeconds: () => [55, 56],
//   };
// };
const disabledDate = (current: Dayjs) => {
  return current && current > dayjs().endOf('day');
};
</script>

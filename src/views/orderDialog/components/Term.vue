<!-- 期限 -->
<template>
  <el-date-picker
    :format="dateFormat"
    v-model="date"
    type="datetime"
    placeholder="Select Time"
  />
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";

// import dayjs, { Dayjs } from "dayjs";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const dateFormat = "DD/MM/YY HH:mm";

const date = ref(dayjs().add(12, "minute").valueOf());

// Can not select days before today
// const disabledDate = (current: Dayjs) => {
//   return current && current < dayjs().startOf("day");
// };

const dayTimeStamp = computed(() => {
  const datestr = dayjs(date.value).format(dateFormat);
  const timeStamp = dayjs(datestr, dateFormat).unix();
  return timeStamp;
});

const model = defineModel("term");
watchEffect(() => {
  model.value = dayTimeStamp.value.toString();
});
</script>

<!-- 期限 -->
<template>
  <a-date-picker
    style="width: 100%"
    show-time
    placeholder="Select Time"
    :format="dateFormat"
    :disabled-date="disabledDate"
    v-model:value="date"
  />
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";

import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const dateFormat = "DD/MM/YY HH:mm";

const date = ref<Dayjs>(dayjs().add(12, "minute"));

// Can not select days before today
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf("day");
};

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

<!-- 期限 -->
<template>
  <a-flex gap="4">
    <a-form-item no-style>
      <a-date-picker
        style="width: 100%"
        :allowClear="false"
        v-model:value="day"
        :format="dateFormat"
        :disabled-date="disabledDate"
      />
    </a-form-item>
    <a-form-item no-style>
      <a-time-picker
        style="width: 100%"
        v-model:value="time"
        :allowClear="false"
        :format="timeFormat"
        :showNow="false"
      />
    </a-form-item>
  </a-flex>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";

import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const dateFormat = "DD/MM/YYYY";
const timeFormat = "HH:mm";

const day = ref<Dayjs>(dayjs());
const time = ref<Dayjs>(dayjs().add(12, "minute"));

// Can not select days before today
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf("day");
};

onMounted(() => {
  time.value = dayjs().add(12, "minute");
  day.value = dayjs();
});

const dayTimeStamp = computed(() => {
  const daystr = dayjs(day.value).format(dateFormat);
  const timestr = dayjs(time.value).format(timeFormat);
  const timeStamp = dayjs(
    `${daystr} ${timestr}`,
    `${dateFormat} ${timeFormat}`
  ).unix();
  return timeStamp;
});

const model = defineModel("term");
watchEffect(() => {
  model.value = dayTimeStamp.value.toString();
});
</script>

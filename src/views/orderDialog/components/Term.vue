<!-- 期限 -->
<template>
  <el-form-item name="dueDate" label="期限" label-position="top">
    <el-date-picker
      :format="dateFormat"
      v-model="model"
      value-format="X"
      type="datetime"
      placeholder="Select Time"
      style="width: 100%"
    />
  </el-form-item>
</template>

<script setup lang="ts">
// import dayjs, { Dayjs } from "dayjs";
import { onMounted } from "vue";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTime } from "@/store/modules/time";

dayjs.extend(relativeTime);
const timeStore = useTime();

const dateFormat = "YY-MM-DD HH:mm";

// Can not select days before today
// const disabledDate = (current: Dayjs) => {
//   return current && current < dayjs().startOf("day");
// };

const model = defineModel<string | number>("term");
onMounted(() => {
  if (!model.value) {
    const timezone = timeStore.settedTimezone;
    model.value = dayjs().tz(timezone).add(12, "minute").unix();
  }
});
</script>

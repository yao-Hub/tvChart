<!-- 期限 -->
<template>
  <el-form-item name="dueDate" :label="t('order.term')" label-position="top">
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
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

dayjs.extend(relativeTime);

const dateFormat = "YY-MM-DD HH:mm:ss";

const model = defineModel<string | number>("term");
onMounted(() => {
  if (!model.value) {
    model.value = dayjs().day(6).hour(23).minute(59).second(59).unix();
  }
});
onUnmounted(() => {
  model.value = "";
});
</script>

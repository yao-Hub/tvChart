<template>
  <div class="transaction">
    <div class="transaction_left">
      <el-icon><Sunny /></el-icon>
      <span>{{ $t("lightTheme") }}</span>
    </div>
    <el-switch v-model="checked" @change="handleChange" size="small" />
  </div>
</template>

<script setup lang="ts">
import { Sunny } from "@element-plus/icons-vue";

import { ref } from "vue";
import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();

const checked = ref(false);
checked.value = themeStore.systemTheme !== "dark";
const handleChange = () => {
  themeStore.changeSystemTheme();
  themeStore.setChartTheme();
};
</script>

<style lang="scss" scoped>
.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  height: 32px;

  &_left {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}
</style>

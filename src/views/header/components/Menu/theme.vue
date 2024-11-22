<template>
  <div class="transaction">
    <div class="transaction_left">
      <img class="logo" src="@/assets/icons/icon_10.svg" />
      <span class="label">{{ $t("lightTheme") }}</span>
    </div>
    <el-switch v-model="checked" @change="handleChange" />
  </div>
</template>

<script setup lang="ts">
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

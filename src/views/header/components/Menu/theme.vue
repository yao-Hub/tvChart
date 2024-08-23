<template>
  <div class="transaction">
    <div class="transaction_left">
      <BulbOutlined />
      <span>{{ $t("lightTheme") }}</span>
    </div>
    <a-switch v-model:checked="checked" size="small" @change="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { BulbOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();
const systemTheme = themeStore.getSystemTheme();

const checked = ref(false);
checked.value = systemTheme !== "dark";
const handleChange = (checked: boolean) => {
  themeStore.setSystemTheme(checked ? "light" : "dark");
  themeStore.setChartTheme();
};
</script>

<style lang="scss" scoped>
.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;

  &_left {
    display: flex;
    gap: 5px;
  }
}
</style>

<template>
  <div class="Theme">
    <div class="Theme_left">
      <BaseImg class="logo" iconName="icon_10" />
      <span>{{ t("lightTheme") }}</span>
    </div>
    <el-switch v-model="checked" @change="handleChange" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { useTheme } from "@/store/modules/theme";
import { ref } from "vue";
const themeStore = useTheme();

const checked = ref(false);
checked.value = themeStore.systemTheme !== "dark";
const emit = defineEmits(["closeDropdown"]);

const handleChange = () => {
  themeStore.changeSystemTheme();
  themeStore.setChartTheme();
  emit("closeDropdown");
};
</script>

<style lang="scss" scoped>
.Theme {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  height: 100%;

  &_left {
    display: flex;
    align-items: center;
    gap: 5px;
  }
}
</style>

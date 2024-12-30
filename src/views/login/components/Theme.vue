<template>
  <el-segmented v-model="value" :options="options" @change="handleChange">
    <template #default="{ item }">
      <BaseImg :iconName="item.icon"></BaseImg>
    </template>
  </el-segmented>
</template>

<script setup>
import { useTheme } from "@/store/modules/theme";
import { ref } from "vue";
const themeStore = useTheme();
const options = [
  {
    label: "light",
    value: "light",
    icon: "sun",
  },
  {
    label: "dark",
    value: "dark",
    icon: "moon",
  },
];
const value = ref(themeStore.systemTheme);

const handleChange = () => {
  themeStore.changeSystemTheme();
};
</script>

<style lang="scss">
.el-segmented {
  padding: 0;
  border: 1px solid #dee2e9;
}
html.dark .el-segmented {
  border: 1px solid #2c2f35;
  padding: 0;
}
</style>

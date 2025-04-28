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

<style lang="scss"></style>

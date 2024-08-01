<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();
const language = ref(locale.value);

const handleChange = (value: string) => {
  locale.value = value;
  localStorage.setItem("language", value);
};
</script>

<template>
  <a-select
    ref="select"
    v-model:value="language"
    style="width: 120px"
    @change="handleChange"
  >
    <a-select-option value="zh">中文</a-select-option>
    <a-select-option value="en">English</a-select-option>
  </a-select>
</template>

<style scoped></style>

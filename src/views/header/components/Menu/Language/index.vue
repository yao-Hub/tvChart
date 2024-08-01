<template>
  <a-menu-item v-for="(value, key) in localeList" :key="key">
    <div class="item" @click="changeLocale(key)">
      <span>{{ value.nowLocale }}</span>
      <CheckOutlined v-if="curentLocale === key" />
    </div>
  </a-menu-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CheckOutlined } from "@ant-design/icons-vue";
import i18n from "@/language/index";
import { useI18n } from "vue-i18n";
const { locale } = useI18n();

const localeList = i18n.global.messages.value;
const curentLocale = computed(() => {
  return locale.value;
});

const changeLocale = (value: string) => {
  locale.value = value;
  window.localStorage.setItem("language", value);
  window.location.reload();
};
</script>

<style lang="scss" scoped>
.item {
  width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
}
</style>

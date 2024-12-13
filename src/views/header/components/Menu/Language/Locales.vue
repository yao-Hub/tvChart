<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="(value, key) in localeList">
      <div class="localeItem" @click="changeLocale(key)">
        <span>{{ value.nowLocale }}</span>
        <BaseImg class="logo" iconName="select" v-if="curentLocale === key" />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import i18n from "@/language/index";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { locale } = useI18n();

const localeList = i18n.global.messages.value;
const curentLocale = computed(() => {
  return locale.value;
});

const changeLocale = (value: string) => {
  locale.value = value;
  localStorage.setItem("language", value);
  window.location.reload();
};
</script>

<style lang="scss" scoped>
.localeItem {
  width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
}
</style>

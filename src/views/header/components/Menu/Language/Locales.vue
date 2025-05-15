<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="(value, key) in languageStore.localeList">
      <div class="localeItem" @click="languageStore.changeLocale(key)">
        <span>{{ value.nowLocale }}</span>
        <BaseImg
          class="logo"
          iconName="select"
          v-if="languageStore.curentLocale === key"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useLanguage } from "@/store/modules/language";
const languageStore = useLanguage();
</script>

<style lang="scss" scoped>
.localeItem {
  min-width: 182px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
</style>

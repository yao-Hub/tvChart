<template>
  <div class="page">
    <el-result :sub-title="t('tip.page404')">
      <template #icon>
        <BaseImg iconName="icon_404" />
      </template>
      <template #extra>
        <el-button type="primary" @click="$router.replace({ path: '/' })">{{
          t("goHome")
        }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<template>
  <div class="emptyBox">
    <BaseImg iconName="icon_empty"></BaseImg>
    <div class="tipWords">
      <span>{{ t("tip.noData") }}</span>
      <span>{{ t("tip.addMySymbol") }}</span>
    </div>
    <el-button type="primary" @click="emit('btnClick')" class="addBtn">{{
      t("tip.addMyOption")
    }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const emit = defineEmits(["btnClick"]);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.emptyBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .tipWords {
    @include font_color("word-info");
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .addBtn {
    min-width: 86px;
    margin-top: 8px;
  }
}
</style>

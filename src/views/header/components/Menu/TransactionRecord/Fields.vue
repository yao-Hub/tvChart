<template>
  <el-dropdown-menu :hide-on-click="false">
    <el-dropdown-item v-for="field in fieldList">
      <div class="fieldItem" @click="handleChange(field)">
        <span>{{ t(`transactionRecord.${field}`) }}</span>
        <BaseImg
          class="logo"
          iconName="select"
          v-if="useChartOrderLine().recordShowState[field]"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { useChartOrderLine } from "@/store/modules/chartOrderLine";

const { t } = useI18n();

const fieldList = ["positions", "pending", "histories", "sltp"];
const handleChange = (field: string) => {
  useChartOrderLine().changeRecordShow(field);
};
</script>

<style lang="scss" scoped>
.fieldItem {
  min-width: 182px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
</style>

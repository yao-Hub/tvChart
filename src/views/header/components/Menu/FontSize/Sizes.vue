<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="size in sizeList">
      <div class="sizeItem" @click="handleChange(size)">
        <span>{{ t(`font.${size}`) }}</span>
        <BaseImg
          class="logo"
          iconName="select"
          v-if="sizeStore.systemSize === size"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { useSize } from "@/store/modules/size";
const sizeStore = useSize();

const sizeList: ["small", "default", "large"] = ["small", "default", "large"];
const emit = defineEmits(["closeDropdown"]);

const handleChange = (size: "small" | "default" | "large") => {
  sizeStore.changeSize(size);
  emit("closeDropdown");
};
</script>

<style lang="scss" scoped>
.sizeItem {
  min-width: 182px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}
</style>

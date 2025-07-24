<template>
  <el-dropdown
    ref="dropdown"
    trigger="contextmenu"
    @visible-change="handleVisibleChange"
    placement="bottom-end"
  >
    <div class="menuBox" @click="toggle(!visible)">
      <BaseImg :iconName="visible ? 'menuActive' : 'menuUnactive'"></BaseImg>
    </div>
    <template #dropdown>
      <div class="dropdownbox">
        <div class="dropdownbox_item">
          <OneTransactions></OneTransactions>
        </div>
        <el-divider />
        <div class="dropdownbox_item">
          <Theme></Theme>
        </div>
        <div class="dropdownbox_item">
          <Language></Language>
        </div>
        <div class="dropdownbox_item">
          <UpDowncolor></UpDowncolor>
        </div>
        <div class="dropdownbox_item">
          <FontSize></FontSize>
        </div>
        <el-divider />
        <div class="dropdownbox_item">
          <sendFeedback></sendFeedback>
        </div>
        <div class="dropdownbox_item">
          <aboutUs></aboutUs>
        </div>
        <div class="dropdownbox_item">
          <ClearCache></ClearCache>
        </div>
        <div class="dropdownbox_item" v-if="ifElectron">
          <CheckUpdate></CheckUpdate>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { DropdownInstance } from "element-plus";

import eventBus from "utils/eventBus";

import FontSize from "./FontSize/index.vue";
import Language from "./Language/index.vue";
import UpDowncolor from "./UpDowncolor/index.vue";
import aboutUs from "./aboutUs.vue";
import OneTransactions from "./oneTransactions.vue";
import sendFeedback from "./sendFeedback.vue";
import Theme from "./theme.vue";
import ClearCache from "./clearCache.vue";
import CheckUpdate from "./checkUpdate.vue";

const ifElectron = process.env.IF_ELECTRON;

const visible = ref(false);

const dropdown = ref<DropdownInstance>();

eventBus.on("closeDropdown", () => toggle(false));

function toggle(val: boolean) {
  if (!dropdown.value) return;
  if (val) {
    dropdown.value.handleOpen();
  } else {
    dropdown.value.handleClose();
  }
}
const handleVisibleChange = (val: boolean) => {
  visible.value = val;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-dropdown) {
  height: 100%;
}
.menuBox {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  padding: 2px;
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 12px;
  &:hover {
    @include background_color("background-hover");
  }
}

.dropdownbox {
  display: flex;
  flex-direction: column;
  width: 100%;
  &_item {
    height: var(--base-height);
    padding: 0 15px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      @include background_color("background-hover");
    }
  }
}
</style>

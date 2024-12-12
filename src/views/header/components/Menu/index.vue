<template>
  <el-dropdown
    ref="dropdown"
    trigger="contextmenu"
    @visible-change="visible = $event"
    placement="bottom-end"
  >
    <div class="menu">
      <div
        class="menuIcon"
        :class="{ menuIcon_active: visible }"
        @click="toggle(true)"
      ></div>
    </div>
    <template #dropdown>
      <div class="dropdownbox">
        <div class="dropdownbox_item">
          <OneTransactions @closeDropdown="toggle(false)"></OneTransactions>
        </div>
        <div class="divider"></div>
        <div class="dropdownbox_item">
          <Theme @closeDropdown="toggle(false)"></Theme>
        </div>
        <div class="dropdownbox_item">
          <Language @closeDropdown="toggle(false)"></Language>
        </div>
        <div class="dropdownbox_item">
          <UpDowncolor @closeDropdown="toggle(false)"></UpDowncolor>
        </div>
        <div class="dropdownbox_item">
          <FontSize @closeDropdown="toggle(false)"></FontSize>
        </div>
        <div class="divider"></div>
        <div class="dropdownbox_item">
          <sendFeedback @closeDropdown="toggle(false)"></sendFeedback>
        </div>
        <div class="dropdownbox_item">
          <aboutUs @closeDropdown="toggle(false)"></aboutUs>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from "vue";
import OneTransactions from "./oneTransactions.vue";
// import TableSetting from './tableSetting.vue';
import FontSize from "./FontSize/index.vue";
import Language from "./Language/index.vue";
import UpDowncolor from "./UpDowncolor/index.vue";
import aboutUs from "./aboutUs.vue";
import sendFeedback from "./sendFeedback.vue";
import Theme from "./theme.vue";

const visible = ref(false);

import type { DropdownInstance } from "element-plus";

const dropdown = ref<DropdownInstance>();

function toggle(visible: boolean) {
  if (!dropdown.value) return;
  if (visible) {
    dropdown.value.handleOpen();
  } else {
    dropdown.value.handleClose();
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-dropdown) {
  height: 100%;
}
.menu {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 8px;
  .menuIcon {
    background-image: url("@/assets/icons/menu.svg");
    background-repeat: no-repeat;
    background-size: var(--icon-size);
    background-position: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    &:hover {
      @include background_color("background-hover");
    }
    &_active {
      background-image: url("@/assets/icons/menuactive.svg");
    }
  }
}

.dropdownbox {
  display: flex;
  flex-direction: column;
  width: 100%;
  &_item {
    height: var(--size);
    padding: 0 15px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    align-items: center;
    &:hover {
      @include background_color("border");
    }
  }
}

.divider {
  height: 1px;
  @include background_color("border");
  padding: 0 15px;
  background-clip: content-box;
  box-sizing: border-box;
  width: 100%;
  margin: 4px 0;
}
</style>

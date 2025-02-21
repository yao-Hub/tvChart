<template>
  <div
    class="chartTab"
    :class="{
      tabActive: props.active && !props.noActiveStyle,
      tabHover: !props.noHoverStyle,
    }"
    :data-id="props.id"
    @click="emit('tabClick', props.id)"
  >
    <div class="moveIcon"></div>
    <el-dropdown
      placement="bottom-start"
      trigger="contextmenu"
      ref="symbolDropdown"
      @visible-change="symbolVisible = $event"
      @command="emit('symbolCommand', $event, props.id)"
    >
      <div class="el-dropdown-link" @click.stop="toggleSymbolDropdown">
        <el-text :type="props.active ? '' : 'info'">{{ props.symbol }}</el-text>
        <BaseImg class="caretDownIcon" iconName="caretDown" />
      </div>
      <template #dropdown>
        <div class="search">
          <el-input
            class="input"
            v-model="searchInput"
            placeholder="search symbol"
            clearable
          >
            <template #prefix>
              <BaseImg class="logo" iconName="icon_search" />
            </template>
          </el-input>
          <div style="height: 336px">
            <Search
              class="searchList"
              :input="searchInput"
              hideStar
              @item-click="symbolItemSelect"
            ></Search>
          </div>
        </div>
      </template>
    </el-dropdown>
    <el-divider direction="vertical" />
    <el-dropdown
      trigger="contextmenu"
      ref="resolutionDropdown"
      placement="bottom-start"
      @visible-change="resolutionVisible = $event"
    >
      <div class="el-dropdown-link" @click.stop="toggleResolutionDropdown">
        <el-text :type="props.active ? '' : 'info'">{{
          nowResolution
        }}</el-text>
        <BaseImg class="caretDownIcon" iconName="caretDown" />
      </div>
      <template #dropdown>
        <div
          v-for="(value, key) in resolutes"
          class="dropdownItem"
          @click="resoluteItemSelect(key)"
        >
          <span>{{ value }}</span>
          <BaseImg
            class="selectIcon"
            iconName="select"
            v-if="nowResolution === value"
          />
        </div>
      </template>
    </el-dropdown>
    <el-divider direction="vertical" />
    <el-icon
      @click.stop="emit('tabClose', props.id)"
      style="margin-left: auto; cursor: pointer"
      v-if="!props.hideCloseBtn"
    >
      <Close />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import type { DropdownInstance } from "element-plus";
import { computed, ref } from "vue";

import { RESOLUTES } from "@/constants/common";

import Search from "../Symbolsearch/index.vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  id: string;
  active?: boolean;
  symbol?: string;
  interval?: string | number;
  noActiveStyle?: boolean;
  noHoverStyle?: boolean;
  hideCloseBtn?: boolean;
}
const props = defineProps<Props>();

const emit = defineEmits([
  "tabClick",
  "symbolCommand",
  "resolutionCommand",
  "tabClose",
]);

const symbolDropdown = ref<DropdownInstance>();
const resolutionDropdown = ref<DropdownInstance>();
const symbolVisible = ref(false);
// 商品下拉菜单显示隐藏
const toggleSymbolDropdown = () => {
  if (!props.active) {
    emit("tabClick", props.id);
    return;
  }
  if (symbolDropdown.value) {
    !symbolVisible.value
      ? symbolDropdown.value.handleOpen()
      : symbolDropdown.value.handleClose();
  }
};
const resolutionVisible = ref(false);
// 周期下拉菜单显示隐藏
const toggleResolutionDropdown = () => {
  if (!props.active) {
    emit("tabClick", props.id);
    return;
  }
  if (resolutionDropdown.value) {
    resolutionDropdown.value.handleOpen();
    !resolutionVisible.value
      ? resolutionDropdown.value.handleOpen()
      : resolutionDropdown.value.handleClose();
  }
};

const searchInput = ref("");

const nowResolution = computed(() => {
  if (props.interval) {
    const interval = RESOLUTES[props.interval];
    return t(`resolute.${interval}`);
  }
});
const resolutes = computed(() => {
  const result: any = {};
  for (const i in RESOLUTES) {
    const interval = RESOLUTES[i];
    result[i] = t(`resolute.${interval}`);
  }
  return result;
});

const symbolItemSelect = (e: any) => {
  emit("symbolCommand", e.symbol, props.id);
  symbolDropdown.value!.handleClose();
};
const resoluteItemSelect = (key: number) => {
  emit("resolutionCommand", key, props.id);
  resolutionDropdown.value!.handleClose();
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-popper) {
  transform: translateX(-40px);
}
.chartTab {
  display: flex;
  padding: 0 8px;
  height: var(--component-size);
  align-items: center;
  gap: 8px;
  @include background_color("background");
  box-sizing: border-box;
}
.tabActive {
  @include background_color("background-component");
}
.tabHover:hover {
  @include background_color("background-hover");
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;
}

.dropdownItem {
  align-items: center;
  justify-content: space-between;
  display: flex;
  width: 120px;
  height: 40px;
  box-sizing: border-box;
  padding: 0 16px;
  @include background_color("background-dialog");
  cursor: pointer;
  &:hover {
    @include background_color("background");
  }
}

.search {
  @include background_color("background-dialog");
  overflow: hidden;

  .input {
    margin: 8px;
    width: 240px;
  }
  .searchList {
    @include background_color("background-dialog");
  }
}

.moveIcon {
  cursor: grab;
  width: 8px;
  height: 18px;
  background-image: url("@/assets/icons/light/icon_drag2.svg");
  background-size: cover;
}
</style>

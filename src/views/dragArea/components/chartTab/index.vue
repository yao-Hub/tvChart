<template>
  <div
    class="chartTab"
    :class="{ active: props.active && !props.noActiveStyle }"
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
              :headerStyle="{
                background: '#f6f8fb',
              }"
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
// 品种下拉菜单显示隐藏
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
    const val = RESOLUTES[props.interval];
    const timeTYpe = val.split(" ")[1];
    const timeVal = val.split(" ")[0];
    return `${timeVal}${t(`resolute.${timeTYpe}`)}`;
  }
});
const resolutes = computed(() => {
  const result: any = {};
  for (const i in RESOLUTES) {
    const item = RESOLUTES[i];
    const timeTYpe = item.split(" ")[1];
    const timeVal = item.split(" ")[0];
    result[i] = `${timeVal}${t(`resolute.${timeTYpe}`)}`;
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
  box-sizing: border-box;
  height: var(--size);
  align-items: center;
  gap: 8px;
  width: fit-content;
  border: 1px solid;
  border-bottom: none;
  @include border_color("border");
  border-radius: 4px 4px 0px 0px;
  // @include background_color("background");
  @include background_color("background-component");
}
.active {
  // @include background_color("background-component");
  @include background_color("background");
  border: none;
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

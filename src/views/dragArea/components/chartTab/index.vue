<template>
  <div
    class="chartTab"
    :class="{ active: props.active }"
    :data-id="props.id"
    @click="emit('tabClick', props.id)"
  >
    <div class="moveIcon"></div>
    <!-- <el-icon class="moveIcon">
      <Mic />
    </el-icon> -->
    <el-dropdown
      trigger="contextmenu"
      ref="symbolDropdown"
      placement="bottom-start"
      @visible-change="symbolVisible = $event"
      @command="emit('symbolCommand', $event, props.id)"
    >
      <div class="el-dropdown-link symbolLink" @click.stop="toggleSymbol">
        {{ props.symbol
        }}<el-icon>
          <CaretBottom />
        </el-icon>
      </div>
      <template #dropdown>
        <div class="search">
          <el-input v-model="searchInput" placeholder="search symbol" clearable>
            <template #prefix>
              <el-icon>
                <search />
              </el-icon>
            </template>
          </el-input>
        </div>
        <el-scrollbar style="height: 200px">
          <el-dropdown-item v-for="item in symbols" :command="item.symbol">{{
            item.symbol
          }}</el-dropdown-item>
        </el-scrollbar>
      </template>
    </el-dropdown>
    <el-divider direction="vertical" />
    <el-dropdown
      trigger="contextmenu"
      ref="resolutionDropdown"
      placement="bottom"
      @visible-change="resolutionVisible = $event"
      @command="emit('resolutionCommand', $event, props.id)"
    >
      <div class="el-dropdown-link" @click.stop="toggleResolution">
        {{ getResolution
        }}<el-icon>
          <CaretBottom />
        </el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-item v-for="(value, key) in resolutes" :command="key">
          <div style="min-width: 100px; text-align: center">
            {{ value }}
          </div>
        </el-dropdown-item>
      </template>
    </el-dropdown>
    <el-divider direction="vertical" />
    <el-icon @click.stop="emit('tabClose', props.id)">
      <Close />
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { DropdownInstance } from "element-plus";

import { selectMatchItem } from "utils/common";
import { RESOLUTES } from "@/constants/common";

import { useChartSub } from "@/store/modules/chartSub";
const subStore = useChartSub();

import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  id: string;
  active?: boolean;
  symbol?: string;
  interval?: string | number;
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
const toggleSymbol = () => {
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
const toggleResolution = () => {
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
const symbols = computed(() => {
  const result = selectMatchItem(
    subStore.tradeAllowSymbols,
    searchInput.value,
    "symbol"
  );
  return result;
});

const getResolution = computed(() => {
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
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.chartTab {
  display: flex;
  padding: 0 8px;
  box-sizing: border-box;
  height: 40px;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  @include border_color("background");
  width: fit-content;
  border-radius: 2px;
  cursor: pointer;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.symbolLink {
  font-weight: 500;
}

.active {
  @include background_color("background");
}

.search {
  padding: 8px;
  width: 200px;
}

.moveIcon {
  cursor: grab;
  width: 8px;
  height: 18px;
  background-image: url("@/assets/icons/icon_drag2.svg");
  background-size: cover;
}
</style>

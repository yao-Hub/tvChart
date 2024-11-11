<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="expandIcon">
      <div class="expandIcon_left">
        <FontSizeOutlined />
        <span>{{ $t("font.fontSize") }}</span>
      </div>
      <div class="expandIcon_right">
        <span>{{ $t(`font.${nowSize}`) }}</span>
        <RightOutlined style="font-size: 12px" />
      </div>
    </div>
    <template #dropdown>
      <Sizes :nowSize="nowSize" @changeSize="setFontSize"></Sizes>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { RightOutlined, FontSizeOutlined } from "@ant-design/icons-vue";
import Sizes from "./Sizes.vue";
import { ref } from "vue";
import { useStorage } from "@/store/modules/storage";
const storageStore = useStorage();

const nowSize = ref("small");
nowSize.value = storageStore.getItem("fontSize") || "small";
document.documentElement.setAttribute("data-size", nowSize.value);

const setFontSize = (size: string) => {
  nowSize.value = size;
};
</script>

<style lang="scss" scoped>
.expandIcon {
  width: 200px;
  display: flex;
  justify-content: space-between;
  height: 32px;
  align-items: center;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>

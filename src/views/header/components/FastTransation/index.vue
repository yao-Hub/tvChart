<template>
  <a-tooltip title="快捷交易">
    <ThunderboltFilled
      v-if="quiTransStore.ifQuick"
      @click="() => debounceSetQuiTrans(false)"
    />
    <ThunderboltOutlined v-else @click="() => debounceSetQuiTrans(true)" />
  </a-tooltip>
</template>

<script setup lang="ts">
import { ThunderboltOutlined, ThunderboltFilled } from "@ant-design/icons-vue";
import { debounce } from "lodash";
import { useQuiTrans } from "@/store/modules/quickTransaction";

const quiTransStore = useQuiTrans();

const debounceSetQuiTrans = debounce((e: boolean) => {
  quiTransStore.setQuiTrans(e);
}, 200);
</script>

<style lang="scss" scoped>
span {
  cursor: pointer;
}
</style>

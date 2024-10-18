<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="size in sizeList">
      <div class="item" @click="changeSize(size)">
        <span>{{ $t(`font.${size}`) }}</span>
        <CheckOutlined v-if="props.nowSize === size" class="checkIcon" />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CheckOutlined } from "@ant-design/icons-vue";

const sizeList = ["small", "medium", "large"];

interface Props {
  nowSize: string;
}
const props = defineProps<Props>();

const emit = defineEmits(["changeSize"]);

const changeSize = (size: string) => {
  document.documentElement.setAttribute("data-size", size);
  localStorage.setItem("fontSize", size);
  emit("changeSize", size);
};
</script>

<style lang="scss" scoped>
.item {
  width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
}
</style>

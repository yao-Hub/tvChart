<template>
  <div>
    <el-input v-model="model" type="number" @blur="inputBlur">
      <template #prefix>
        <span class="btn" @click="handleSubtract">-</span>
      </template>
      <template #suffix>
        <span class="btn" @click="handleAdd">+</span>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
import Decimal from "decimal.js";

interface Props {
  step?: string | number;
}
const props = withDefaults(defineProps<Props>(), {
  step: 1,
});
const model = defineModel<string | number>("value");
const emit = defineEmits(["blur"]);

const inputBlur = () => {
  emit("blur", model.value);
};

const handleSubtract = () => {
  model.value = Decimal.sub(model.value || 0, +props.step).toString();
};
const handleAdd = () => {
  model.value = new Decimal(+props.step).plus(model.value || 0).toString();
};
</script>

<style lang="scss" scoped>
.btn {
  cursor: pointer;
  font-size: 16px;
  box-sizing: border-box;
  -moz-user-select: none;
  -o-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
:deep input {
  text-align: center;
}
</style>

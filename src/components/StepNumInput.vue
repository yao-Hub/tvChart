<template>
  <el-input
    v-model="model"
    type="number"
    :disabled="disabled"
    @blur="blur"
    @input="input"
    :class="{ danger: valid }"
  >
    <template #prefix>
      <span class="btn" @click="handleSubtract()">-</span>
    </template>
    <template #suffix>
      <span class="btn" @click="handleAdd()">+</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import Decimal from "decimal.js";

interface Props {
  disabled?: boolean;
  valid?: boolean;
  step?: string | number;
  customAdd?: () => string | void;
  customSub?: () => void | string;
}
const props = withDefaults(defineProps<Props>(), {
  step: 1,
});
const model = defineModel<string | number>("value");
const emit = defineEmits(["blur", "sub", "plus", "input"]);

const blur = () => {
  emit("blur", model.value);
};
const input = () => {
  emit("input", model.value);
};

const handleSubtract = () => {
  let result = Decimal.sub(model.value || 0, +props.step).toString();
  if (props.customSub) {
    const value = props.customSub();
    result = value || result;
  }
  model.value = result;
  emit("sub", result);
};
const handleAdd = () => {
  let result = new Decimal(+props.step).plus(model.value || 0).toString();
  if (props.customAdd) {
    const value = props.customAdd();
    result = value || result;
  }
  model.value = result;
  emit("plus", result);
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
:deep(input) {
  text-align: center;
}

.danger {
  --el-input-border-color: #f56c6c;
  --el-border-color-hover: #f56c6c;
  --el-input-focus-border-color: #f56c6c;
}
</style>

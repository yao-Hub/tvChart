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
      <BaseImg class="btn" iconName="icon_sub" @click="handleSubtract()" />
    </template>
    <template #suffix>
      <BaseImg class="btn" iconName="icon_plus" @click="handleAdd()" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import Decimal from "decimal.js";
import { isNil } from "lodash";

interface Props {
  disabled?: boolean;
  valid?: boolean;
  step?: string | number;
  customAdd?: () => string | number;
  customSub?: () => string | number;
}
const props = withDefaults(defineProps<Props>(), {
  step: 1,
});
const model = defineModel<string | number>("value");
const emit = defineEmits(["blur", "sub", "plus", "input"]);

const blur = (e: FocusEvent) => {
  emit("blur", model.value);
};
const input = (value: string | number) => {
  emit("input", value);
};

const handleSubtract = () => {
  let result: string | number = Decimal.sub(
    model.value || 0,
    +props.step
  ).toString();
  if (props.customSub) {
    const value = props.customSub();
    result = isNil(value) ? result : value;
  }
  model.value = result;
  emit("sub", result);
};
const handleAdd = () => {
  let result: string | number = new Decimal(+props.step)
    .plus(model.value || 0)
    .toString();
  if (props.customAdd) {
    const value = props.customAdd();
    result = isNil(value) ? result : value;
  }
  model.value = result;
  emit("plus", result);
};
</script>

<style lang="scss" scoped>
.btn {
  width: 18px;
  height: 18px;
  cursor: pointer;
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

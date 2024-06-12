<template>
  <div class="linkage">
    <div v-for="(value, key) in state" :key="key" class="item">
      <a-input v-model:value="state[key]" :disabled="!props.disabled" @change="handleChange(key)">
        <template #prefix v-if="focusKey !== key">
          <span>~</span>
        </template>
        <template #addonAfter>
          <div class="afterBtns">
            <CaretUpFilled @click="addNum(key)"/>
            <CaretDownFilled @click="reduceNum(key)"/>
          </div>
        </template>
        <template #suffix v-if="key === 'balance'">
          <span>%</span>
        </template>
      </a-input>
      <span v-if="props.showName" class="name">{{ $t(`order.${key}`) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';
interface Props {
  showName?: Boolean,
  disabled: Boolean,
}
const props = withDefaults(defineProps<Props>(), {
  showName: false,
  disabled: false,
});

const state = reactive({
  point: '',
  price: '',
  balance: '',
  profit: ''
});

const focusKey = ref<string>('point');

const addNum = (key: string) => {
  const currentNum = state[key] * 1;
  state[key] = `${currentNum + 1}`;
  focusKey.value = key;
};
const reduceNum = (key: string) => {
  const currentNum = state[key] * 1;
  state[key] = `${currentNum - 1}`;
  focusKey.value = key;
};
const handleChange = (key: string) => {
  focusKey.value = key;
};

watch(() => props.disabled, (newVal) => {
  if (!newVal) {
    for (const i in state) {
      state[i] = '';
    }
  }
});

</script>

<style lang="scss" scoped>
  .linkage {
    display: flex;
    flex-direction: column;
    gap: 3px;
    .item {
      display: flex;
      .name {
        width: 100px;
        text-align: center;
      }
    }
  }
  .afterBtns {
    display: flex;
    flex-direction: column;
    & span {
      color: #7f7f7f;
    }
    & span:hover {
      color: #fff;
    }
  }
</style>
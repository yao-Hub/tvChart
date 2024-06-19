<template>
  <div class="EntryPrice">
    <span>入场价</span>
    <div class="container">
      <a-tooltip :title="state.errorMessage" v-model:open="state.ifError">
        <a-input
          v-model:value="state.price"
          @change="handleChange">
          <template #addonAfter>
            <div class="afterBtns">
              <CaretUpFilled @click="addPrice" />
              <CaretDownFilled @click="reducePrice" />
            </div>
          </template>
        </a-input>
      </a-tooltip>
    </div>
    <span>距离：{{ }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';

const state = reactive({
  price: '',
  ifError: false,
  errorMessage: ''
});

const handleChange = () => {};
const addPrice = () => {};
const reducePrice = () => {};
</script>

<style lang="scss" scoped>
.EntryPrice {
  display: flex;
  width: 45%;
  flex-direction: column;
  .container {
    flex: 1;
    .complete::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: #9f4747;
      z-index: 1;
      border-radius: 5px;
      opacity: 0.6;
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
  }
}
</style>
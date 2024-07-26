<template>
  <div class="transaction">
    <div class="transaction_left">
      <DollarCircleFilled />
      <span>快捷交易</span>
    </div>
    <a-switch v-model:checked="checked" size="small" />
  </div>
</template>

<script setup lang="ts">
import { DollarCircleFilled } from '@ant-design/icons-vue';
import { ref } from 'vue';

const checked = ref(false);

</script>

<style lang="scss" scoped>
.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;

  &_left {
    display: flex;
    gap: 5px;
  }
}
</style>

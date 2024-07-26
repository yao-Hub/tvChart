<template>
  <div class="transaction">
    <div class="transaction_left">
      <BulbOutlined />
      <span>亮色主题</span>
    </div>
    <a-switch v-model:checked="checked" size="small" />
  </div>
</template>

<script setup lang="ts">
import { BulbOutlined } from '@ant-design/icons-vue';
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

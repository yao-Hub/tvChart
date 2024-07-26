<template>
  <a-menu-item :icon="h(SlidersOutlined)">
    <div class="item">
      <span>红涨绿跌</span>
      <CheckOutlined />
    </div>
  </a-menu-item>
  <a-menu-item :icon="h(SlidersOutlined)">
    <div class="item">
      <span>绿涨红跌</span>
      <CheckOutlined />
    </div>
  </a-menu-item>
</template>

<script setup lang="ts">
import { SlidersOutlined, CheckOutlined } from '@ant-design/icons-vue';
import { h } from 'vue';
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
<template>
    <a-spin class="spin" :indicator="indicator"/>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { LoadingOutlined } from '@ant-design/icons-vue';

const indicator = h(LoadingOutlined, {
  style: {
    fontSize: '50px',
  },
  spin: true,
});
</script>

<style lang="scss" scoped>
.spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%);
}
</style>

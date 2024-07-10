<template>
  <div>
    <div class="container">
      <div class="item_1"></div>
      <div class="item_2"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sortable from 'sortablejs';
import { onMounted } from 'vue';
onMounted(() => {
  const container = document.querySelector('.container') as HTMLElement;
  Sortable.create(container, {
    // group: 'foo',
    animation: 100
  })
})
</script>

<style scoped lang="scss">
.container {
  width: 500px;
  height: 500px;
  border: 1px solid red;

  .item_1 {
    width: 200px;
    height: 200px;
    border: 1px solid pink;
  }

  .item_1 {
    width: 200px;
    height: 200px;
    border: 1px solid green;
  }
}
</style>

<template>
  <div class="orderArea">
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.orderArea {
  width: 100%;
  height: 200px;
  border-top: 1px solid;
  box-sizing: border-box;
  @include border_color('border');
  @include background_color('primary');
}
</style>
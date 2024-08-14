<template>
 <Transition name="nested">
  <div v-if="show" class="outer">
    <div class="inner">
      Hello
    </div>
  </div>
</Transition>
</template>

<script setup>
import { ref } from 'vue';
const show = ref(false);

setTimeout(() => show.value = !show.value, 2000);
</script>

<style>
div {
  width: 100px;
  height: 100px;
  background-color: red;
}
/* 应用于嵌套元素的规则 */
.nested-enter-active .inner,
.nested-leave-active .inner {
  transition: all 0.3s ease-in-out;
}

.nested-enter-from .inner,
.nested-leave-to .inner {
  transform: translateX(30px);
  opacity: 0;
}

</style>

<template>
  <div class="dragArea">
    <div class="resizeLine" @mousedown="resizeLineMousedown"></div>
    <div class="dragArea_item dragArea_item_top">
      <div class="demo">
        <HolderOutlined class="handle" />
        <slot name="one"></slot>
      </div>
      <div class="demo">
        <HolderOutlined class="handle" />
        <slot name="two"></slot>
      </div>
    </div>
    <div class="dragArea_item dragArea_item_down">
      <div class="demo">
        <HolderOutlined class="handle" />
        <slot name="three"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from 'vue';
import Sortable from 'sortablejs';
import { HolderOutlined } from '@ant-design/icons-vue';

const emit = defineEmits(['isResizing']);

const resizeLineMousedown = () => {
  emit('isResizing', true);
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const down = document.querySelector('.dragArea_item_down') as HTMLElement;
  const resizeLine = document.querySelector('.resizeLine') as HTMLElement;
  function resize(e: MouseEvent) {
    const containerRect = top.getBoundingClientRect();
    let mouseY = e.clientY - containerRect.top;
    top.style.height = `${mouseY}px`;
    resizeLine.style.top = `${mouseY}px`;
    down.style.height = `${dragArea.getBoundingClientRect().height - mouseY - 3}px`;
    down.style.top = `${mouseY + 3}px`;
  }
  function stopResize() {
    emit('isResizing', false);
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};


onMounted(async () => {
  await nextTick();
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  var nestedSortables = [].slice.call(document.querySelectorAll('.dragArea_item'));
  for (var i = 0; i < nestedSortables.length; i++) {
    new Sortable(nestedSortables[i], {
      group: 'nested',
      animation: 150,
      handle: '.handle',
      fallbackOnBody: true,
    });
  }
  const resizeLine = document.querySelector('.resizeLine') as HTMLElement;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;
  dragArea_item_top.style.height = dragArea.getBoundingClientRect().height / 2 - 1.5 + 'px';
  dragArea_item_down.style.height = dragArea.getBoundingClientRect().height / 2 - 3 + 'px';
  dragArea_item_down.style.top = dragArea.getBoundingClientRect().height / 2 + 3 + 'px';
  resizeLine.style.top = dragArea.getBoundingClientRect().height / 2 + 'px';
});
</script>

<style lang="scss" scoped>
.dragArea {
  overflow: hidden;
  width: 100vw;
  height: 100%;
  box-sizing: border-box;
  position: relative;

  .dragArea_item {
    display: flex;
    width: 100%;
    gap: 5px;
    box-sizing: border-box;
    position: absolute;
    top: 0;
    left: 0;
  }

  .demo {
    flex: 1;
    width: 0;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    user-select: none;
    overflow: auto;
    .handle {
      position: absolute;
      top: 10px;
      left: 5px;
      z-index: 2;
    }
  }

  .resizeLine {
    height: 3px;
    cursor: row-resize;
    width: 100%;
    position: absolute;
    z-index: 9;
    &:hover {
      background-color: #7cb305;
    }
  }
}
</style>

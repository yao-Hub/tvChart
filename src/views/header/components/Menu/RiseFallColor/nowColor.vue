<template>
  <div class="nowColor">
    <div class="nowColor_left">
      <BgColorsOutlined />
      <span>涨跌颜色</span>
    </div>
    <div class="nowColor_right">
      <span>红涨绿跌</span>
      <RightOutlined style="font-size: 12px"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RightOutlined, BgColorsOutlined} from '@ant-design/icons-vue';
</script>

<style lang="scss" scoped>
.nowColor {
  display: flex;
  justify-content: space-between;
  margin-inline-end: -17px;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>
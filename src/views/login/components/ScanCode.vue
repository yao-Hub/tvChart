<template>
  <div class="scanCode">
    <div class="phoneTIp">手机扫码登录</div>
    <div
      class="qrcode-container"
      :style="{
        transform: ifGuide
          ? 'translate(-17%, -50%) scale(0.75)'
          : 'translate(-50%, -50%) scale(1)',
      }"
    >
      <QRCodeVue
        :value="qrValue"
        :size="size"
        level="H"
        :margin="2"
        class="qrcode"
      />
      <div class="expire" v-if="ifExpire">
        <span class="tip">二维码已失效</span>
        <div class="btn">刷新</div>
      </div>
      <BaseImg class="logo" iconName="logo@3x" imgSuffix="png"></BaseImg>
    </div>
    <img
      :style="{
        opacity: ifGuide ? 1 : 0,
        transform: ifGuide ? 'translate(-120%, -50%)' : 'translate(-50%, -50%)',
      }"
      class="guide"
      src="https://img.alicdn.com/imgextra/i1/O1CN01z4Whpc1sWXrNMex9p_!!6000000005774-2-tps-236-298.png"
    />
    <div class="scan-tip">
      <span>打开</span>
      <span class="app-name">CTOTrader APP</span>
      <span>扫码登录</span>
    </div>
    <span
      class="guide-tip"
      @mouseenter="ifGuide = true"
      @mouseleave="ifGuide = false"
      >如何扫码登录？</span
    >
  </div>
</template>

<script setup lang="ts">
import QRCodeVue from "qrcode.vue";
import { ref } from "vue";

const qrValue = ref("https://www.baidu.com");
const size = ref(200);

const ifExpire = ref(false);
const ifGuide = ref(false);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.scanCode {
  width: 350px;
  height: calc(100% - 55px);
  position: relative;
}
.phoneTIp {
  font-size: 24px;
  line-height: 40px;
  position: absolute;
  left: 50%;
  top: 50px;
  transform: translate(-50%, 0);
}
.guide {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 118px;
  height: 149px;
  transition: all 1s ease;
  z-index: 1;
}
.scan-tip {
  width: 100%;
  text-align: center;
  position: absolute;
  bottom: 145px;
  left: 50%;
  transform: translate(-50%);
  .app-name {
    @include font_color("primary");
  }
}
.guide-tip {
  width: 100%;
  text-align: center;
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translate(-50%);
  cursor: pointer;
}
.qrcode-container {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  border: 1px solid;
  overflow: hidden;
  @include border_color("word-info");
  position: absolute;
  top: 50%;
  left: 50%;
  transition: all 1s ease;
  z-index: 1;
}
.logo {
  width: 20%;
  height: 20%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}
.expire {
  position: absolute;
  top: 0;
  left: 0;
  width: 195px;
  height: 195px;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 3;
  opacity: 0.98;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .tip {
    font-weight: 500;
    font-size: 16px;
    color: #000;
  }
  .btn {
    margin-top: 20px;
    width: 94px;
    height: 42px;
    border-radius: 21px;
    background: linear-gradient(
        0deg,
        hsla(0, 0%, 100%, 0.05),
        hsla(0, 0%, 100%, 0.05)
      ),
      #fff;
    border: 1px solid rgba(0, 0, 0, 0.2);
    color: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
}
</style>

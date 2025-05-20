<template>
  <div class="scanCode">
    <div class="phoneTIp">{{ t("scanCode.title") }}</div>
    <div
      class="qrcode-container"
      :style="{
        transform: ifGuide
          ? 'translate(-17%, -50%) scale(0.72)'
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
      <div class="status" v-if="codeType === 'expire'">
        <span class="expireWord">{{ t("scanCode.invalidCode") }}</span>
        <el-button type="primary" class="freshBtn">{{
          t("refresh")
        }}</el-button>
      </div>

      <div class="status" v-if="codeType === 'success'">
        <BaseImg iconName="icon_success"></BaseImg>
        <span class="successWord">{{ t("scanCode.waitConfirm") }}</span>
      </div>
    </div>

    <img
      :style="{
        opacity: ifGuide ? 1 : 0,
        transform: ifGuide ? 'translate(-115%, -50%)' : 'translate(-50%, -50%)',
        zIndex: codeType === 'expire' ? 0 : 9,
      }"
      class="guide"
      src="@/assets/images/guide.png"
    />

    <div class="scan-tip">
      <span>{{ t("scanCode.open") }}</span>
      <span class="app-name">{{ t("scanCode.place") }}</span>
      <span>{{ t("scanCode.action") }}</span>
    </div>

    <span
      class="guide-tip"
      @mouseenter="ifGuide = true"
      @mouseleave="ifGuide = false"
      >{{ t("scanCode.guide") }}</span
    >
  </div>
</template>

<script setup lang="ts">
import QRCodeVue from "qrcode.vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const qrValue = ref("https://www.baidu.com");
const size = ref(200);

const codeType = ref<"normal" | "success" | "expire">("normal");
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
  width: 100%;
  text-align: center;
  font-size: 24px;
  line-height: 40px;
  position: absolute;
  left: 50%;
  top: 50px;
  transform: translate(-50%, 0);
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
  @include border_color("border");
  position: absolute;
  top: 50%;
  left: 50%;
  transition: all 1s ease;
  z-index: 1;
}
.status {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  @include background_color("noScanCode");
  .expireWord {
    font-weight: 500;
    font-size: 16px;
    @include font_color("word");
  }
  .freshBtn {
    margin-top: 20px;
    width: 84px;
    height: 32px;
  }
  .icon_success {
    width: 64px;
    height: 64px;
  }
  .successWord {
    font-weight: 500;
    font-size: 16px;
    @include font_color("word");
    margin-top: 20px;
  }
}

.guide {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 120px;
  height: 144px;
  transition: all 1s ease;
  z-index: 1;
}

.scan-tip {
  width: 100%;
  text-align: center;
  position: absolute;
  bottom: 136px;
  left: 50%;
  transform: translate(-50%);
  line-height: normal;
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
</style>

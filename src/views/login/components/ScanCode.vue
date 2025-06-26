<template>
  <div class="scanCode">
    <el-scrollbar view-class="scanCodeScrollbarView">
      <div class="phoneTip">{{ t("scanCode.title") }}</div>
      <div class="scanCode-container">
        <div
          class="qrcode"
          :style="{
            transform: ifGuide
              ? 'translate(-10%) scale(0.75)'
              : 'translate(-50%)',
          }"
        >
          <div class="code" @click="getScanCode" :title="t('scanCode.refresh')">
            <QRCodeVue
              :value="qrcodeStore.qrcodeVal"
              :size="180"
              :margin="1"
              level="H"
              :image-settings="imageSettings"
            />
          </div>
          <div class="status" v-if="qrcodeStore.codeType === 'expire'">
            <span class="expireWord">{{ t("scanCode.invalidCode") }}</span>
            <el-button type="primary" class="freshBtn" @click="getScanCode">{{
              t("refresh")
            }}</el-button>
          </div>
          <div class="status" v-if="qrcodeStore.codeType === 'waiting'">
            <BaseImg iconName="icon_success"></BaseImg>
            <span class="waitingWord">{{ t("scanCode.waitConfirm") }}</span>
          </div>

          <div class="status" v-if="qrcodeStore.codeType === 'pending'">
            <div class="pendingBox" v-loading="true"></div>
          </div>
          <div class="status" v-if="qrcodeStore.codeType === 'success'">
            <BaseImg iconName="icon_success"></BaseImg>
            <span class="waitingWord">{{ t("scanCode.logging") }}</span>
          </div>
        </div>

        <div
          class="guide"
          :style="{
            opacity: ifGuide ? 1 : 0,
            transform: ifGuide
              ? 'translate(-95%, -50%) scale(0.75)'
              : 'translate(-50%, -50%)',
            zIndex: ifGuide ? 9 : -1,
          }"
        >
          <img src="@/assets/images/guide.png" />
        </div>
      </div>
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
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import QRCodeVue from "qrcode.vue";
import type { ImageSettings } from "qrcode.vue";

import { useSocket } from "@/store/modules/socket";
import { useQrcode } from "@/store/modules/qrcode";

const { t } = useI18n();
const qrcodeStore = useQrcode();

const scanCodeImage = new URL(
  `../../../assets/icons/scanCodeLogo.svg`,
  import.meta.url
).href;
const imageSettings = ref<ImageSettings>({
  src: scanCodeImage,
  width: 32,
  height: 32,
  // excavate: true, // logo旁边是否留白
});

const ifGuide = ref(false);
const getScanCode = () => {
  useSocket().emitQrcodeInit();
};

onMounted(() => {
  qrcodeStore.init();
});
</script>

<style lang="scss">
@import "@/styles/_handle.scss";

.scanCodeScrollbarView {
  height: 100%;
  min-height: 430px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid;
  position: relative;
  @include border_color("border");
}
</style>
<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-loading-mask) {
  background-color: unset;
}
.scanCode {
  width: 440px;
  padding: 32px 0;
  box-sizing: border-box;
}

.phoneTip {
  font-size: 24px;
  line-height: 40px;
}

.scanCode-container {
  width: 100%;
  height: 200px;
  transition: all 0.5s ease;
  position: absolute;
  top: 108px;
  .qrcode {
    width: 200px;
    height: 200px;
    border: 1px solid;
    @include border_color("border");
    position: absolute;
    top: 0;
    left: 50%;
    transition: all 0.5s ease-in-out;
    overflow: hidden;
    border-radius: 4px;

    .code {
      width: 200px;
      height: 200px;
      background-color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      .scanCodeLogo {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
    }

    .status {
      width: 100%;
      height: 100%;
      @include background_color("noScanCode");
      position: absolute;
      top: 0;
      left: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      .expireWord {
        font-weight: 500;
        font-size: 16px;
        @include font_color("word");
      }
      .freshBtn {
        width: 84px;
        height: 32px;
      }
      .icon_success {
        width: 64px;
        height: 64px;
      }
      .waitingWord {
        font-weight: 500;
        font-size: 16px;
        @include font_color("word");
      }
      .pendingBox {
        width: 100%;
        height: 100%;
      }
    }
  }
  .guide {
    width: 200px;
    height: 200px;
    position: absolute;
    transition: all 0.5s ease;
    top: 50%;
    left: 50%;
    padding: 1px;
    img {
      width: 100%;
      height: 100%;
    }
  }
}

.scan-tip {
  text-align: center;
  line-height: normal;
  position: absolute;
  top: 330px;
  .app-name {
    @include font_color("primary");
  }
}
.guide-tip {
  position: absolute;
  bottom: 5px;
  cursor: pointer;
}
</style>

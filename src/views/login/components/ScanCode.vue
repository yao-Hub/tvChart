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
              :value="qrValue"
              :size="180"
              :margin="1"
              level="H"
              :image-settings="imageSettings"
            />
            <!-- 覆盖中心logo -->
            <img class="scanCodeLogo" src="@/assets/icons/scanCodeLogo.svg" />
          </div>
          <div class="status" v-if="codeType === 'expire'">
            <span class="expireWord">{{ t("scanCode.invalidCode") }}</span>
            <el-button type="primary" class="freshBtn" @click="getScanCode">{{
              t("refresh")
            }}</el-button>
          </div>
          <div class="status" v-if="codeType === 'waiting'">
            <BaseImg iconName="icon_success"></BaseImg>
            <span class="waitingWord">{{ t("scanCode.waitConfirm") }}</span>
          </div>

          <div class="status" v-if="codeType === 'pending'">
            <div class="pendingBox" v-loading="true"></div>
          </div>
          <div class="status" v-if="codeType === 'success'">
            <BaseImg iconName="icon_success"></BaseImg>
            <span class="waitingWord">{{ t("scanCode.logging") }}</span>
          </div>
        </div>
        <img
          class="guide"
          :style="{
            opacity: ifGuide ? 1 : 0,
            transform: ifGuide
              ? 'translate(-120%, -49%)'
              : 'translate(-50%, -50%)',
            zIndex: codeType !== 'expire' && ifGuide ? 9 : -1,
          }"
          src="@/assets/images/guide.png"
        />
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
import { useRouter } from "vue-router";
import QRCodeVue from "qrcode.vue";
import type { ImageSettings } from "qrcode.vue";

import { decrypt, encrypt } from "utils/DES/JS";
import { sendTrack } from "@/utils/track";

import { useSocket } from "@/store/modules/socket";
import { useSystem } from "@/store/modules/system";
import { generateUUID } from "@/utils/common";
import { useUser } from "@/store/modules/user";

const { t } = useI18n();
const router = useRouter();

const qrValue = ref();
const systemStore = useSystem();

const scanCodeImage = new URL(
  `../../../assets/icons/scanCodeLogo.svg`,
  import.meta.url
).href;
const imageSettings = ref<ImageSettings>({
  src: scanCodeImage,
  width: 32,
  height: 32,
  excavate: true, // logo旁边是否留白
});

const codeType = ref<"pending" | "normal" | "waiting" | "expire" | "success">(
  "pending"
);
const ifGuide = ref(false);

const timer = ref<ReturnType<typeof setInterval>>();
const countdown = ref<number>(0); // 剩余秒数
// 初始化倒计时
const initCountdown = (timestamp: number) => {
  // 计算剩余秒数
  const updateCountdown = () => {
    const now = Date.now();
    countdown.value = Math.max(0, Math.floor((timestamp - now) / 1000));
    if (countdown.value <= 0) {
      clearInterval(timer.value);
      codeType.value = "expire";
    }
  };

  // 立即更新一次
  updateCountdown();
  // 每秒更新一次
  timer.value = setInterval(updateCountdown, 1000);
};

const clearTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
  }
};

const getScanCode = async () => {
  let socket = useSocket().onLineSocket;

  if (!socket) {
    socket = await useSocket().onlineSocketInit();
  }

  if (socket) {
    const info = {
      pc_device_id: systemStore.systemInfo!.deviceId,
      pc_device_model: systemStore.systemInfo!.deviceModel,
      pc_device_brand: systemStore.systemInfo!.deviceBrand,
      pc_device_info: systemStore.systemInfo!.deviceInfo,
      pc_ip: systemStore.systemInfo!.localIp,
      req_id: generateUUID(),
      req_time: Date.now(),
    };
    const data = {
      action: "qrcode_init",
      d: encrypt(JSON.stringify(info)),
    };
    codeType.value = "pending";
    socket.emit("qrcode_init", data);

    socket.on("qrcode_init", (d) => {
      codeType.value = "normal";
      const result = JSON.parse(decrypt(d.data));
      qrValue.value = result.qr_code;
      const expirationTime = result.expiration_time;
      initCountdown(expirationTime);
      const pcId = result.pc_device_id;
      if (pcId !== info.pc_device_id) {
        codeType.value = "expire";
      }
    });
    // 扫码成功登录
    socket.on("qr_code_login", (d) => {
      clearTimer();
      const result = JSON.parse(decrypt(d));
      const { server, login, pc_token, status } = result;
      // 已扫码
      if (status === "1") {
        const expirationTime = result.verify_time + 60 * 1000;
        initCountdown(expirationTime);
        codeType.value = "waiting";
        return;
      }
      // 已作废
      if (status === "3") {
        clearTimer();
        codeType.value = "expire";
        return;
      }
      if (status === "2" && pc_token && login && server) {
        clearTimer();
        codeType.value = "success";
        useUser().addAccount({
          token: pc_token,
          server,
          ifLogin: true,
          login,
        });
        sendTrack({
          actionType: "signUp",
          actionObject: "scanCode",
        });
        router.push({ path: "/" });
        return;
      }
      codeType.value = "expire";
    });
  }
};

onMounted(() => {
  if (!qrValue.value) {
    getScanCode();
  }
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
  width: 380px;
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
    box-sizing: border-box;
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
    width: 120px;
    height: 150px;
    position: absolute;
    transition: all 0.5s ease;
    top: 50%;
    left: 50%;
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

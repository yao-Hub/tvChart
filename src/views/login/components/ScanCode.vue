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
        <el-button type="primary" class="freshBtn" @click="emitScanCode">{{
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
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import QRCodeVue from "qrcode.vue";

import { decrypt, encrypt } from "utils/DES/JS";
import { sendTrack } from "@/utils/track";

import { useSocket } from "@/store/modules/socket";
import { useSystem } from "@/store/modules/system";
import { generateUUID } from "@/utils/common";
import { useUser } from "@/store/modules/user";

const { t } = useI18n();
const router = useRouter();

const qrValue = ref();
const size = ref(200);
const systemStore = useSystem();

const codeType = ref<"pending" | "normal" | "waiting" | "expire" | "success">(
  "normal"
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

watch(
  () => useSocket().onLineSocket,
  () => {
    emitScanCode();

    // setTimeout(() => {
    //   useUser().addAccount({
    //     token: "77473d33-20f9-4969-81a1-6fcc80c3adeb",
    //     server: "CTOTrader-demo",
    //     ifLogin: true,
    //     login: 9527,
    //   });
    //   router.push({ path: "/" });
    // }, 2000);
  },
  { once: true }
);
const emitScanCode = async () => {
  const socket = useSocket().onLineSocket;
  if (!useSystem().systemInfo) {
    await useSystem().getSystemInfo();
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
      console.log("qrcode_init", result);
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
      if (timer.value) {
        clearInterval(timer.value);
      }
      const result = JSON.parse(decrypt(d));
      console.log("qr_code_login", result);
      const { server, login, pc_token, status } = result;
      // 已扫码
      if (status === "1") {
        codeType.value = "waiting";
        return;
      }
      // 已作废
      if (status === "3") {
        codeType.value = "expire";
        return;
      }
      if (status === "2" && pc_token && login && server) {
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
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-loading-mask) {
  background-color: unset;
}
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
  .waitingWord {
    font-weight: 500;
    font-size: 16px;
    @include font_color("word");
    margin-top: 20px;
  }
  .pendingBox {
    width: 100%;
    height: 100%;
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
  bottom: 20%;
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
  bottom: 5%;
  left: 50%;
  transform: translate(-50%);
  cursor: pointer;
}
</style>

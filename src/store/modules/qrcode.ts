import { defineStore } from "pinia";
import { ref } from "vue";
import { useSocket } from "./socket";
import { decrypt } from "@/utils/DES/JS";
import { useSystem } from "./system";
import { useUser } from "./user";
import { sendTrack } from "@/utils/track";
import router from "@/router";
import dayjs from "dayjs";

type TQrcodeType = "pending" | "normal" | "waiting" | "expire" | "success";

export const useQrcode = defineStore("qrcode", () => {
  const timer = ref<ReturnType<typeof setInterval>>();
  const countdown = ref<number>(0); // 剩余秒数
  const codeType = ref<TQrcodeType>("pending");
  const qrcodeVal = ref<string>("");
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

  const init = () => {
    if (!qrcodeVal.value) {
      useSocket().emitQrcodeInit();
    } else {
      codeType.value = "normal";
    }
    useSocket().subQrcodeInit((d) => {
      codeType.value = "normal";
      const result = JSON.parse(decrypt(d.data));
      console.log("qrcode_init", result);
      qrcodeVal.value = result.qr_code;
      const expirationTime = result.expiration_time;
      console.log(
        "qrcode_init 过期时间",
        dayjs(expirationTime).format("YYYY-MM-DD HH:mm:ss")
      );
      clearTimer();
      initCountdown(expirationTime);
      const deviceId = useSystem().systemInfo!.deviceId;
      const pcId = result.pc_device_id;
      if (pcId !== deviceId) {
        codeType.value = "expire";
      }
    });
    useSocket().subQrcodeLogin((d) => {
      clearTimer();
      const result = JSON.parse(decrypt(d));
      console.log("qrcode_login", result);
      const { server, login, pc_token, status } = result;
      if (result.verify_time) {
        const expirationTime = result.verify_time + 60 * 1000;
        console.log(
          "qrcode_login 过期时间",
          dayjs(expirationTime).format("YYYY-MM-DD HH:mm:ss")
        );
        initCountdown(expirationTime);
      }
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
  };

  function $reset() {
    codeType.value = "pending";
    qrcodeVal.value = "";
  }

  return { init, $reset, qrcodeVal, codeType };
});

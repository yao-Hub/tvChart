<template>
  <div class="login">
    <BaseImg class="title" iconName="title" imgSuffix="png" />
    <span class="welcome">{{ $t("welcomeToUTrader") }}</span>
    <router-view v-slot="{ Component }">
      <div class="container">
        <transition :name="direction" mode="out-in">
          <div class="main" :key="Component">
            <component :is="Component" :lineInfo="lineInfo" />
          </div>
        </transition>
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { virtualLine } from "api/account/index";
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";

const router = useRouter();

const networkStore = useNetwork();
const userStore = useUser();

userStore.initAccount();

const lineInfo = ref({
  lineName: "", // 交易线路名称
  brokerName: "", // 经纪商名称
  lineLogo: "", // 显示图像
  brokerCode: "", // 经纪商编码
  lineCode: "", // 交易线路编码
});

// 获取虚拟线路的信息 用于注册和更改密码（目前只能更改虚拟账号的密码）
virtualLine().then((res) => {
  lineInfo.value = res.data;
});
networkStore.getLines();
const direction = ref("slide-forward");
watch(
  () => router.currentRoute.value,
  (to, from) => {
    if (to.meta.depth && from.meta.depth && to.meta.depth > from.meta.depth) {
      direction.value = "slide-forward";
    } else {
      direction.value = "slide-backward";
    }
  }
);
</script>

<style lang="scss">
@import "@/styles/_handle.scss";
[data-theme="light"] .login {
  background-image: url("@/assets/images/light/loginBg@2x.png");
}
[data-theme="dark"] .login {
  background-image: url("@/assets/images/dark/loginBg@2x.png");
}

.login {
  width: 100vw;
  height: 100vh;
  min-width: 1280px;
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;
  overflow: hidden;
  .welcome {
    position: absolute;
    left: 18.65%;
    top: 20%;
    font-size: 40px;
    font-weight: bold;
    height: 648px;
  }
  .title {
    position: absolute;
    left: 72px;
    top: 32px;
    width: 176px;
    height: 36px;
  }
  .container {
    position: absolute;
    right: 13.33%;
    top: 50%;
    transform: translate(0, -50%);
    width: 512px;
    height: 648px;
    .main {
      width: 100%;
      height: 100%;
      @include background_color("background-login-container");
      box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      box-sizing: border-box;
    }
  }
}

/* 前进动画 */
.slide-forward-enter-active,
.slide-forward-leave-active {
  transition: transform 0.5s ease, opacity 0.2s ease;
}
.slide-forward-enter-from {
  transform: translateX(100%);
  opacity: 1;
}
.slide-forward-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 后退动画 */
.slide-backward-enter-active,
.slide-backward-leave-active {
  transition: transform 0.5s ease, opacity 0.2s ease;
}
.slide-backward-enter-from {
  opacity: 1;
  transform: translateX(-100%);
}
.slide-backward-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

<template>
  <div class="login">
    <BaseImg class="title" iconName="title" imgSuffix="png" />
    <span class="welcome">{{ $t("welcomeToUTrader") }}</span>
    <div class="main">
      <router-view :lineInfo="lineInfo" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { virtualLine } from "api/account/index";
import { ref } from "vue";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";

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
  .main {
    position: absolute;
    right: 13.33%;
    top: 50%;
    transform: translate(0, -50%);
    width: 512px;
    height: 648px;
    @include background_color("background");
    box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    box-sizing: border-box;
  }
}
</style>

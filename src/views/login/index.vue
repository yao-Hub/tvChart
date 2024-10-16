<template>
  <div class="login">
    <span class="welcome">欢迎使用UTrader</span>
    <component
      class="main"
      :lineInfo="lineInfo"
      :is="state.componentMap[state.currentComponent]"
      @register="state.currentComponent = 'register'"
      @forgetPassword="state.currentComponent = 'forgetPassword'"
      @goBack="state.currentComponent = 'login'"
    ></component>
  </div>
</template>

<script setup lang="ts">
import { reactive, markRaw, ref, onMounted } from "vue";
import { virtualLine } from "api/account/index";

import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import ForgetPassword from "./components/ForgetPassword.vue";

import { useUser } from "@/store/modules/user";
const userStore = useUser();
userStore.initUser();

const state = reactive({
  componentMap: {
    login: markRaw(Login),
    register: markRaw(Register),
    forgetPassword: markRaw(ForgetPassword),
  } as Record<string, any>,
  currentComponent: "login",
});

const lineInfo = ref({
  lineName: "", // 交易线路名称
  brokerName: "", // 经纪商名称
  lineLogo: "", // 显示图像
  brokerCode: "", // 经纪商编码
  lineCode: "", // 交易线路编码
});

onMounted(() => {
  // 获取虚拟线路
  (async function () {
    const res = await virtualLine();
    lineInfo.value = res.data;
  })();
});
</script>

<style lang="scss">
@import "@/styles/_handle.scss";

.login {
  width: 100vw;
  height: 100vh;
  min-width: 1200px;
  background-image: url("@/assets/images/loginBg@3x.png");
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;
  .welcome {
    position: absolute;
    left: 18%;
    top: 216px;
    font-size: 40px;
    font-weight: bold;
  }
  .main {
    position: absolute;
    left: 66.67%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>

<style>
</style>

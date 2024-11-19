<template>
  <div class="login">
    <span class="welcome">欢迎使用UTrader</span>
    <img class="title" src="@/assets/icons/title.png" />
    <component
      class="main"
      :lineInfo="lineInfo"
      :is="state.componentMap[state.currentComponent]"
      v-bind="state.props"
      @goCom="goCom"
      @goBack="state.currentComponent = 'login'"
      @goHome="goHome"
    ></component>
  </div>
</template>

<script setup lang="ts">
import { reactive, markRaw, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { virtualLine } from "api/account/index";

import Login from "./components/Login.vue";
import Register from "./components/Register.vue";
import ForgetPassword from "./components/ForgetPassword.vue";
import Accounts from "./components/Accounts.vue";

import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

const networkStore = useNetwork();
const userStore = useUser();
const router = useRouter();
const route = useRoute();

const state = reactive({
  componentMap: {
    login: markRaw(Login),
    register: markRaw(Register),
    forgetPassword: markRaw(ForgetPassword),
    accounts: markRaw(Accounts),
  } as Record<string, any>,
  currentComponent: "login",
  props: {},
});

userStore.initAccount();

if (Object.keys(route.query).length) {
  state.props = route.query;
} else if (userStore.accountList.length) {
  state.currentComponent = "accounts";
}

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

const goCom = (name: string, props?: any) => {
  state.currentComponent = name;
  if (props) {
    state.props = props;
  }
};

const goHome = () => {
  router.push({ path: "/" });
};
</script>

<style lang="scss">
@import "@/styles/_handle.scss";

.login {
  width: 100vw;
  height: 100vh;
  min-width: 1280px;
  background-image: url("@/assets/images/loginBg@2x.png");
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
  }
}
</style>

<style></style>

<template>
  <div class="otp">
    <ScanCode></ScanCode>
    <div class="otpBox">
      <div class="backBox">
        <div class="backBox_back" @click="back">
          <BaseImg iconName="turnleft" />
          <span class="backBox_back_text">{{ t("back") }}</span>
        </div>
        <span class="title">{{ t("otp.title") }}</span>
      </div>

      <el-form
        ref="formRef"
        :model="formState"
        label-position="top"
        :rules="rules"
        class="otp-form"
      >
        <el-form-item prop="server" label="OTP">
          <el-input
            v-model="formState.otp_code"
            :placeholder="t('tip.enterVeriCode')"
          />
        </el-form-item>
        <el-button
          class="login-form-button"
          type="primary"
          :disabled="!formState.otp_code"
          :loading="loading"
          @click="happyStart"
          >{{ t("account.login") }}</el-button
        >
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { PageEnum } from "@/constants/pageEnum";
import CryptoJS from "utils/AES";

import ScanCode from "./ScanCode.vue";
import { useUser } from "@/store/modules/user";
import { ElNotification } from "element-plus";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const formState = reactive({
  otp_code: "",
});
const loading = ref(false);

const rules = reactive({
  otp_code: [
    {
      required: true,
      trigger: "change",
      message: t("tip.enterVeriCode"),
    },
  ],
});

if (!route.query.server || !route.query.login) {
  router.replace({ path: PageEnum.LOGIN });
}

const back = () => {
  router.replace({ path: PageEnum.LOGIN_HOME, query: { ...route.query } });
};

const happyStart = () => {
  const { otp_code } = formState;
  if (!otp_code || loading.value) {
    return;
  }
  loading.value = true;
  const enPwd = localStorage.getItem("ctraderTemP");
  const login = route.query.login as string;
  const server = route.query.server as string;
  if (enPwd && login && server) {
    const password = CryptoJS.decrypt(enPwd);
    useUser().login(
      { login, server, password, otp_code },
      ({ ending, success, errmsg }) => {
        loading.value = !ending;
        if (ending && success) {
          router.push({ path: "/" });
        }
        if (ending && !success && errmsg) {
          ElNotification({
            message: t(errmsg),
            type: "error",
          });
        }
      }
    );
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.otp {
  display: flex;
  height: calc(100% - 56px);
}

.otpBox {
  height: 100%;
  width: 558px;
  display: flex;
  flex-direction: column;
  padding: 32px 104px;
  box-sizing: border-box;
  margin-right: 2px;
}

.backBox {
  display: flex;
  align-items: center;
  line-height: 40px;
  gap: 16px;
  @include background_color("background-login-container");
  &_back {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 9px;
    @include font_color("word");
    &_text {
      font-size: 18px;
      font-weight: 500;
    }
    &:hover {
      @include font_color("primary");
    }
    &:active {
      @include font_color("primary-active");
    }
  }
  .title {
    font-size: 24px;
    font-weight: 500;
  }
}

.otp-form {
  flex: 1;
  margin-top: 22px;
  font-size: 16px !important;
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>

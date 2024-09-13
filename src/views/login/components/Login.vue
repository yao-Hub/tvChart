<template>
  <div class="container">
    <span class="plogin">登录您的账号</span>
    <span class="padd">已有交易账号，可直接登录，如没有，可开模</span>
    <a-form
      size="large"
      :model="formState"
      layout="vertical"
      name="normal_login"
      class="login-form"
      :rules="rules"
      @finish="onFinish"
    >
      <a-form-item name="server" :label="$t('order.tradingRoute')">
        <a-select
          show-search
          v-model:value="formState.server"
          :options="networkStore.queryTradeLines"
          :filter-option="filterOption"
          :field-names="{ label: 'lineName', value: 'lineName' }"
        >
          <template #suffixIcon
            ><SearchOutlined style="font-size: 18px"
          /></template>
        </a-select>
      </a-form-item>

      <a-form-item :label="$t('user.login')" name="login">
        <a-input v-model:value="formState.login">
          <template #prefix>
            <UserOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item :label="$t('user.password')" name="password">
        <a-input-password v-model:value="formState.password">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <div class="login-form-remember">
          <a-form-item name="remember" no-style>
            <a-checkbox v-model:checked="formState.remember">{{
              $t("account.rememberMe")
            }}</a-checkbox>
          </a-form-item>
          <a-form-item name="forgetPassword" no-style>
            <span class="link" @click="emit('forgetPassword')">{{
              $t("account.forgetPassword")
            }}</span>
          </a-form-item>
        </div>
      </a-form-item>

      <a-form-item>
        <a-button
          :disabled="disabled"
          type="primary"
          html-type="submit"
          class="login-form-button"
          :loading="formState.logging"
        >
          {{ $t("account.login") }}
        </a-button>
      </a-form-item>
      <a-form-item>
        <div class="login-form-account">
          <span> {{ $t("account.noAccount") }}</span>
          <span class="link" @click="emit('register')">{{
            $t("account.createAccount")
          }}</span>
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import {
  UserOutlined,
  LockOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
import { pick } from 'lodash'
import CryptoJS from "utils/AES";
import { useUser } from "@/store/modules/user";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
const userStore = useUser();
const router = useRouter();
const { t } = useI18n();

const rules: Record<string, Rule[]> = {
  server: [
    {
      required: true,
      trigger: "change",
      message: "Please select tradingRoute!",
    },
  ],
  login: [
    {
      required: true,
      trigger: "change",
      message: "Please input your login!",
    },
  ],
  password: [
    {
      required: true,
      message: "Please input your password!",
      trigger: "change",
    },
  ],
};

interface FormState {
  login: string;
  password: string;
  remember: boolean;
  server: string;
  logging: boolean;
}
const formState = reactive<FormState>({
  server: "",
  login: "",
  password: "",
  remember: true,
  logging: false,
});

// 获取网络节点
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();

(async function () {
  await networkStore.getLines();
  // 记住密码自动填充
  const ifRemember = window.localStorage.getItem("remember");
  if (ifRemember) {
    const account = window.localStorage.getItem("account");
    const parseAccount = account ? JSON.parse(account) : {};
    if (parseAccount.server) {
      formState.server = CryptoJS.decrypt(parseAccount.server);
    }
    if (parseAccount.login) {
      formState.login = CryptoJS.decrypt(parseAccount.login);
    }
    if (parseAccount.password) {
      formState.password = CryptoJS.decrypt(parseAccount.password);
    }
  }
})();

const filterOption = (input: string, option: any) => {
  const regex = new RegExp(input.split("").join(".*"), "i");
  return regex.test(option.lineName);
};

const onFinish = async (values: any) => {
  try {
    formState.logging = true;
    const data = pick(values, ['login', 'password', 'queryNode', 'server']);
    await userStore.login(data);
    window.localStorage.setItem("remember", JSON.stringify(values.remember));
    message.success(t("tip.succeed", { type: t("account.login") }));
    router.push({ path: "/" });
  } finally {
    formState.logging = false;
  }
};

const disabled = computed(() => {
  return !(formState.login && formState.password);
});

const emit = defineEmits(["register", "forgetPassword"]);
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.container {
  position: relative;
  width: 512px;
  height: 648px;
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  padding: 56px;
  .plogin {
    font-weight: 500;
    font-size: 28px;
    height: 40px;
  }
  .padd {
    font-weight: 400;
    font-size: 14px;
    @include font_color("word-gray");
  }
}

.login-form {
  margin-top: 32px;
  width: 100%;
  font-size: 16px !important;
  &-remember {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &-account {
    display: flex;
    justify-content: center;
  }
  &-button {
    width: 100%;
  }
}

.link {
  @include font_color("word-gray");
  font-size: 12px;
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>

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
          :field-names="{ label: 'lineName', value: 'lineCode' }"
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
import { reactive, computed, watch } from "vue";
import { message } from "ant-design-vue";
import {
  UserOutlined,
  LockOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import type { Rule } from "ant-design-vue/es/form";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import CryptoJS from "utils/AES";
import { Login } from "api/account/index";
import { useUser } from "@/store/modules/user";

const router = useRouter();
const { t } = useI18n();

const userStore = useUser();

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
networkStore.getLines();
const filterOption = (input: string, option: any) => {
  const regex = new RegExp(input.split("").join(".*"), "i");
  return regex.test(option.label);
};
watch(
  () => formState.server,
  (val) => {
    if (val) {
      networkStore.getNodes(val);
    }
  }
);

// 记住密码自动填充
const ifRemember = window.localStorage.getItem("remember");
if (ifRemember) {
  const account = window.localStorage.getItem("account");
  const parseAccount = account ? JSON.parse(account) : {};
  formState.server = CryptoJS.decrypt(parseAccount.server || "");
  formState.login = CryptoJS.decrypt(parseAccount.login);
  formState.password = CryptoJS.decrypt(parseAccount.password);
}

const onFinish = async (values: any) => {
  try {
    formState.logging = true;
    const { login, remember, password, server } = values;
    const nodeList = networkStore.nodeList;
    if (nodeList.length === 0) {
      return message.info('找不到网络节点，请切换交易线路重试');
    }
    for (let i in nodeList) {
      const item = nodeList[i];
      try {
        networkStore.nodeName = item.nodeName;
        const res = await Login({ password, login, server });
        message.success(t("tip.succeed", { type: t("account.login") }));
        userStore.setToken(res.data.token);
        userStore.account.password = password;
        userStore.account.login = login;
        userStore.account.server = server;
        const enlogin = CryptoJS.encrypt(login);
        const enpassword = CryptoJS.encrypt(password);
        const enserver = CryptoJS.encrypt(server);
        const enNode = CryptoJS.encrypt(item.nodeName);
        const storage = {
          login: enlogin,
          password: enpassword,
          server: enserver,
          queryNode: enNode,
        };
        window.localStorage.setItem("account", JSON.stringify(storage));
        window.localStorage.setItem("remember", JSON.stringify(remember));
        router.push({ path: "/" });
        return;
      } catch (error) {
        continue;
      }
    }
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

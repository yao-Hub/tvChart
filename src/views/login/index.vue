<template>
  <div class="login">
    <img src="/vite.svg" />

    <div class="login_title">
      <span style="font-size: 24px">{{ $t("account.login") }}</span>
      <span style="font-size: 12px">{{ $t("tip.ifHasAcount") }}</span>
    </div>

    <a-form
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
        </a-select>
      </a-form-item>

      <a-form-item name="queryNode" :label="$t('order.queryNode')">
        <a-select
          show-search
          v-model:value="formState.queryNode"
          :options="networkStore.nodeList"
          :field-names="{ label: 'nodeName', value: 'nodeName' }"
        >
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

      <a-form-item style="position: relative">
        <a-form-item name="remember" no-style>
          <a-checkbox v-model:checked="formState.remember">{{
            $t("account.rememberMe")
          }}</a-checkbox>
        </a-form-item>
        <a-form-item name="forgetPassword" no-style>
          <a-button
            type="link"
            @click="$router.push({ name: 'retrievePassword' })"
            class="login-form-forgot"
            >{{ $t("account.forgetPassword") }}</a-button
          >
        </a-form-item>
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
        <span> {{ $t("account.noAccount") }}</span>
        <a-button
          type="link"
          @click="$router.push({ name: 'register' })"
          :loading="formState.logging"
        >
          {{ $t("account.createAccount") }}</a-button
        >
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { message } from "ant-design-vue";
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import type { Rule } from "ant-design-vue/es/form";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import CryptoJS from "utils/AES";
import { Login } from "api/account/index";
import { useUser } from "@/store/modules/user";

const router = useRouter();
const { t } = useI18n();

const userStore = useUser();

const checkNode = async (_rule: Rule, value: string) => {
  if (value === "") {
    return Promise.reject("Please select queryNode!");
  } else {
    if (formState.server === "") {
      return Promise.reject("Please select server!");
    }
    return Promise.resolve();
  }
};
const rules: Record<string, Rule[]> = {
  server: [
    {
      required: true,
      trigger: "change",
      message: "Please select tradingRoute!",
    },
  ],
  queryNode: [
    {
      required: true,
      trigger: "change",
      validator: checkNode,
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
  queryNode: string;
}
const formState = reactive<FormState>({
  server: "",
  login: "",
  password: "",
  remember: true,
  logging: false,
  queryNode: "",
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
  formState.queryNode = CryptoJS.decrypt(parseAccount.queryNode || "");
}

const onFinish = async (values: any) => {
  try {
    formState.logging = true;
    const { login, remember, password, server, queryNode } = values;
    networkStore.nodeName = queryNode;
    const res = await Login({ password, login, server });
    message.success(t("tip.succeed", { type: t("account.login") }));
    userStore.setToken(res.data.token);
    userStore.account.password = password;
    userStore.account.login = login;
    userStore.account.server = server;
    // userStore.account.node = getLineCode();
    const enlogin = CryptoJS.encrypt(login);
    const enpassword = CryptoJS.encrypt(password);
    const enserver = CryptoJS.encrypt(server);
    const enNode = CryptoJS.encrypt(queryNode);
    const storage = {
      login: enlogin,
      password: enpassword,
      server: enserver,
      queryNode: enNode,
    };
    window.localStorage.setItem("account", JSON.stringify(storage));
    window.localStorage.setItem("remember", JSON.stringify(remember));
    router.push({ path: "/" });
  } finally {
    formState.logging = false;
  }
};

const disabled = computed(() => {
  return !(formState.login && formState.password);
});
</script>

<style lang="scss" scoped>
.login {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding-top: 100px;
  box-sizing: border-box;
  overflow: hidden;

  &_title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
}

.login-form-forgot {
  position: absolute;
  right: 0;
  top: 0;
}

.login-form-button {
  width: 100%;
}
</style>

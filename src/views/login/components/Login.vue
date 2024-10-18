<template>
  <div class="Login">
    <span class="plogin">登录您的账号</span>
    <span class="padd">已有交易账号，可直接登录，如没有，可开模</span>
    <el-form
      ref="ruleFormRef"
      :model="formState"
      label-position="top"
      class="login-form"
      :rules="rules"
      size="large"
    >
      <el-form-item prop="server" :label="$t('order.tradingRoute')">
        <el-select
          v-model="formState.server"
          filterable
          default-first-option
          :suffix-icon="Search"
        >
          <el-option
            v-for="item in networkStore.queryTradeLines"
            :key="item.lineName"
            :label="item.lineName"
            :value="item.lineName"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('user.login')" prop="login">
        <el-input v-model="formState.login" placeholder="Please input login" />
      </el-form-item>

      <el-form-item :label="$t('user.password')" prop="password">
        <el-input
          v-model="formState.password"
          type="password"
          placeholder="Please input password"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <div class="login-form-remember">
          <el-checkbox
            v-model="formState.remember"
            :label="$t('account.rememberMe')"
          />
          <span class="link" @click="emit('forgetPassword')">{{
            $t("account.forgetPassword")
          }}</span>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          style="width: 100%"
          type="primary"
          :disabled="disabled"
          :loading="formState.logging"
          @click="happyStart"
          >{{ $t("account.login") }}</el-button
        >
      </el-form-item>
      <el-form-item>
        <div class="login-form-account">
          <span> {{ $t("account.noAccount") }}</span>
          <span class="link" @click="emit('register')">{{
            $t("account.createAccount")
          }}</span>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { Search } from "@element-plus/icons-vue";

import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

import { pick } from "lodash";
import CryptoJS from "utils/AES";
import { useUser } from "@/store/modules/user";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
const userStore = useUser();
const router = useRouter();
const { t } = useI18n();

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
const ruleFormRef = ref<FormInstance>();
const rules = reactive<FormRules<typeof formState>>({
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
});

// 获取网络节点
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();

(function () {
  networkStore.getLines();
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

const happyStart = async () => {
  try {
    formState.logging = true;
    const data = pick(formState, ["login", "password", "server"]);
    await userStore.login(data);
    window.localStorage.setItem("remember", JSON.stringify(formState.remember));
    ElMessage.success(t("tip.succeed", { type: t("account.login") }));
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

<style scoped lang="scss">
@import "@/styles/_handle.scss";
.Login {
  width: 512px;
  height: 648px;
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
  padding: 56px;
  .plogin {
    font-weight: bold;
    font-size: 28px;
    height: 40px;
    line-height: 40px;
    display: block;
  }
  .padd {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    display: block;
    @include font_color("word-gray");
  }
}

.login-form {
  margin-top: 32px;
  width: 100%;
  font-size: 16px !important;
  &-remember {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &-account {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  &-button {
    width: 100%;
  }
}

.link {
  @include font_color("word-gray");
  font-size: var(--font-size);
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>

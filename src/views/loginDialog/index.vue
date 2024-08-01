<template>
  <a-modal
    v-model:open="open"
    :title="$t('account.login')"
    :footer="null"
    @cancel="handleCancel"
  >
    <a-form
      name="basic"
      :model="formState"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed"
    >
      <a-form-item
        :label="$t('user.login')"
        name="login"
        :rules="[{ required: true, message: $t('tip.usernameRequired') }]"
      >
        <a-input v-model:value="formState.login" />
      </a-form-item>

      <a-form-item
        :label="$t('user.password')"
        name="password"
        :rules="[{ required: true, message: $t('tip.passwordRequired') }]"
      >
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item name="remember" :wrapper-col="{ offset: 8, span: 16 }">
        <a-checkbox v-model:checked="formState.remember">{{
          $t("account.rememberMe")
        }}</a-checkbox>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
        <a-button
          type="primary"
          html-type="submit"
          :loading="formState.logging"
          >{{ $t("account.login") }}</a-button
        >
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { message } from "ant-design-vue";
import CryptoJS from "utils/AES";
import { useDialog } from "@/store/modules/dialog";
import { Login } from "api/account/index";
import { useRoot } from "@/store/store";
import { useUser } from "@/store/modules/user";
// import { useChartAction } from '@/store/modules/chartAction';
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const userStore = useUser();
// const chartActionStore = useChartAction();

const open = computed(() => {
  return dialogStore.loginDialogVisible;
});

const dialogStore = useDialog();
const handleCancel = () => {
  dialogStore.closeLoginDialog();
};

interface FormState {
  login: string;
  password: string;
  remember: boolean;
  logging: boolean;
}

const formState = reactive<FormState>({
  login: "",
  password: "",
  remember: true,
  logging: false,
});

// 记住密码自动填充
const ifRemember = window.localStorage.getItem("remember");
if (ifRemember) {
  const account = window.localStorage.getItem("account");
  const parseAccount = account ? JSON.parse(account) : null;
  if (parseAccount) {
    formState.login = CryptoJS.decrypt(parseAccount.login);
    formState.password = CryptoJS.decrypt(parseAccount.password);
  }
}

// 登录提交
const onFinish = async (values: any) => {
  try {
    const { login, remember, password } = values;
    formState.logging = true;
    const res = await Login({ password, login: login });
    message.success(t("tip.succeed", { type: t("account.login") }));

    userStore.setToken(res.data.token);
    userStore.ifLogin = true;
    userStore.account.password = password;
    userStore.account.login = login;
    const enLogin = CryptoJS.encrypt(login);
    const enpassword = CryptoJS.encrypt(password);
    const storage = {
      login: enLogin,
      password: enpassword,
    };
    window.localStorage.setItem("account", JSON.stringify(storage));
    window.localStorage.setItem("remember", JSON.stringify(remember));

    await userStore.getLoginInfo(true);
    // 头像
    // chartActionStore.createAvatar();
    handleCancel();

    // 记忆动作
    const rootStore = useRoot();
    if (rootStore.cacheAction) {
      rootStore[rootStore.cacheAction]();
      rootStore.clearCacheAction();
    }
  } finally {
    formState.logging = false;
  }
};

// 表单不通过
const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};
</script>

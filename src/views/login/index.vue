<template>
  <div class="login">
    <img src="/vite.svg">

    <div class="login_title">
      <span style="font-size: 24px;">登录您的账户</span>
      <span style="font-size: 12px;">已有交易账号，可直接登录，如没有，可开模拟账号</span>
    </div>

    <a-form
      :labelCol="{span: 6}"
      :model="formState"
      name="normal_login"
      class="login-form"
      @finish="onFinish">
      <a-form-item
        label="交易线路"
        name="route">
        <a-select
          v-model:value="formState.route"
          show-search
          placeholder="选择交易线路"
          :options="options"
          :filter-option="filterOption">
        </a-select>
      </a-form-item>

      <a-form-item
        label="账户"
        name="login"
        :rules="[{ required: true, message: 'Please input your login!' }]">
        <a-input v-model:value="formState.login">
          <template #prefix>
            <UserOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        label="密码"
        name="password"
        :rules="[{ required: true, message: 'Please input your password!' }]">
        <a-input-password v-model:value="formState.password">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-form-item name="remember" no-style>
          <a-checkbox v-model:checked="formState.remember">记住我</a-checkbox>
        </a-form-item>
        <a class="login-form-forgot" @click="$router.push({name: 'resetPassword'})">忘记密码？</a>
      </a-form-item>

      <a-form-item>
        <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
          登录
        </a-button>
      </a-form-item>
      <a-form-item>
        <span>没有账号？</span>
        <a-button type="link" @click="$router.push({name: 'register'})" :loading="formState.logging">创建模拟账号</a-button>
      </a-form-item>

    </a-form>

  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue';
import type { SelectProps } from 'ant-design-vue';
import { ref, reactive, computed } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import CryptoJS from 'utils/AES';
import { Login } from 'api/account/index';
import { useUser } from '@/store/modules/user';
import { useI18n } from 'vue-i18n';
import { useRouter } from "vue-router";
const router = useRouter();

const { t } = useI18n();

const userStore = useUser();
const options = ref<SelectProps['options']>([
  { value: 'jack', label: 'Jack' },
  { value: 'lucy', label: 'Lucy' },
  { value: 'tom', label: 'Tom' },
]);
const filterOption = (input: string, option: any) => {
  return option.value.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};

interface FormState {
  login: string;
  password: string;
  remember: boolean;
  route: string;
  logging: boolean;
}
const formState = reactive<FormState>({
  route: '',
  login: '',
  password: '',
  remember: true,
  logging: false
});

// 记住密码自动填充
const ifRemember = window.localStorage.getItem('remember');
if (ifRemember) {
  const account = window.localStorage.getItem('account');
  const parseAccount = account ? JSON.parse(account) : null;
  if (parseAccount) {
    formState.login = CryptoJS.decrypt(parseAccount.login);
    formState.password = CryptoJS.decrypt(parseAccount.password);
  }
}

const onFinish = async (values: any) => {
  try {
    formState.logging = true;
    const { login, remember, password } = values;
    const res = await Login({ password, login });
    message.success(t('tip.succeed', { type: t('account.login') }));
    userStore.setToken(res.data.token);
    userStore.ifLogin = true;
    userStore.account.password = password;
    userStore.account.login = login;
    const enlogin = CryptoJS.encrypt(login);
    const enpassword = CryptoJS.encrypt(password);
    const storage = {
      login: enlogin,
      password: enpassword
    };
    window.localStorage.setItem('account', JSON.stringify(storage));
    window.localStorage.setItem('remember', JSON.stringify(remember));
    await userStore.getLoginInfo(true);
    router.push({ path: '/' });
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
  margin-top: 100px;
  &_title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
  }
}

.login-form {
  max-width: 300px;
}

 .login-form-forgot {
  float: right;
}

.login-form-button {
  width: 100%;
}

</style>
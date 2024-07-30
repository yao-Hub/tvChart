<template>
  <div class="login">
    <img src="/vite.svg">

    <div class="login_title">
      <span style="font-size: 24px;">{{ $t('account.login') }}</span>
      <span style="font-size: 12px;">{{ $t('tip.ifHasAcount') }}</span>
    </div>

    <a-form
      :model="formState"
      name="normal_login"
      class="login-form"
      @finish="onFinish">
      <a-form-item
        :label="$t('order.tradingRoute')"
        name="route">
        <a-select
          v-model:value="formState.route"
          show-search
          :options="options"
          :filter-option="filterOption">
        </a-select>
      </a-form-item>

      <a-form-item
        :label="$t('user.login')"
        name="login"
        :rules="[{ required: true, message: 'Please input your login!' }]">
        <a-input v-model:value="formState.login">
          <template #prefix>
            <UserOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>

      <a-form-item
        :label="$t('user.password')"
        name="password"
        :rules="[{ required: true, message: 'Please input your password!' }]">
        <a-input-password v-model:value="formState.password">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>

      <a-form-item style="position: relative">
        <a-form-item name="remember" no-style>
          <a-checkbox v-model:checked="formState.remember">{{ $t('account.rememberMe') }}</a-checkbox>
        </a-form-item>
        <a-form-item name="forgetPassword" no-style>
          <a-button type="link" @click="$router.push({name: 'resetPassword'})" class="login-form-forgot">{{ $t('account.forgetPassword') }}</a-button>
        </a-form-item>
      </a-form-item>

      <a-form-item>
        <a-button :disabled="disabled" type="primary" html-type="submit" class="login-form-button">
          {{ $t('account.login') }}
        </a-button>
      </a-form-item>
      <a-form-item>
        <span> {{ $t('account.noAccount') }}</span>
        <a-button type="link" @click="$router.push({name: 'register'})" :loading="formState.logging"> {{ $t('account.createAccount') }}</a-button>
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
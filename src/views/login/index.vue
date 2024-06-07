<template>
  <a-modal
    v-model:open="open"
    :title="$t('account.login')"
    :footer="null"
    @cancel="handleCancel">
    <a-form
      name="basic"
      :model="formState"
      :label-col="{ span: 8 }"
      :wrapper-col="{ span: 16 }"
      autocomplete="off"
      @finish="onFinish"
      @finishFailed="onFinishFailed">
      <a-form-item :label="$t('user.username')" name="username" :rules="[{ required: true, message: 'Please input your username!' }]">
        <a-input v-model:value="formState.username" />
      </a-form-item>

      <a-form-item :label="$t('user.password')" name="password" :rules="[{ required: true, message: 'Please input your password!' }]">
        <a-input-password v-model:value="formState.password" />
      </a-form-item>

      <a-form-item name="remember" :wrapper-col="{ offset: 8, span: 16 }">
        <a-checkbox v-model:checked="formState.remember">{{ $t('account.rememberMe') }}</a-checkbox>
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
        <a-button type="primary" html-type="submit">{{ $t('account.login')}}</a-button>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import CryptoJS from 'utils/AES';
import { useDialog } from '@/store/modules/dialog';
import { login } from 'api/account/index';
import { useRoot } from '@/store/store';
import { useUser } from '@/store/modules/user';

const userStore = useUser();

const open = computed(() => {
  return dialogStore.loginDialogVisible;
})

const dialogStore = useDialog();
const handleCancel = () => {
  dialogStore.closeLoginDialog();
}

interface FormState {
  username: string;
  password: string;
  remember: boolean;
}

const formState = reactive<FormState>({
  username: '',
  password: '',
  remember: true
});

// 记住密码自动填充
const ifRemember = window.localStorage.getItem('remember');
if (ifRemember) {
  const account = window.localStorage.getItem('account');
  const parseAccount = account ? JSON.parse(account) : null;
  if (parseAccount) {
    formState.username = CryptoJS.decrypt(parseAccount.username);
    formState.password = CryptoJS.decrypt(parseAccount.password);
  }
}

// 登录提交
const onFinish = async (values: any) => {
  const { username, remember, password } = values;
  const res = await login({ server: 'upway-live', password, login: username });
  if (res.data.token) {
    userStore.setToken(res.data.token);
  }
  if (remember) {
    const enUsername = CryptoJS.encrypt(username);
    const enpassword = CryptoJS.encrypt(password);
    const storage = {
      username: enUsername,
      password: enpassword
    };
    window.localStorage.setItem('account', JSON.stringify(storage));
    window.localStorage.setItem('remember', JSON.stringify(true));
  }
  handleCancel();
  const rootStore = useRoot();
  if (rootStore.cacheAction) {
    rootStore[rootStore.cacheAction]();
    rootStore.clearCacheAction();
  }
};

// 表单不通过
const onFinishFailed = (errorInfo: any) => {
  console.log('Failed:', errorInfo);
};
</script>
<script setup lang="ts">
import { login } from 'api/account/index'
import { Button } from 'ant-design-vue';
import LocaleChange from '@/components/LocaleChange.vue'
import { useRouter } from "vue-router";
import { reactive } from 'vue';

const router = useRouter()

const states = reactive({
  login: 3241,
  password: 'abc111'
});

const Login = () => {
  login({
    server: 'upway-live',
    password: states.password,
    login: states.login
  })
}

</script>

<template>
  <a-space>
    <LocaleChange></LocaleChange>
    <a-date-picker />
    <Button @click="router.push({ name: 'chart' })">{{ $t('chart.name') }}</Button>
  </a-space>
  <div>
    <a-space>
      <a-input v-model:value="states.login" placeholder="login" />
      <a-input v-model:value.lazy="states.password" autofocus placeholder="password" />
    </a-space>
    <Button @click="Login">{{ $t('account.login') }}</Button>
  </div>
</template>
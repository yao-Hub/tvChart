<script setup lang="ts">
import { Login, balanceOrdersAdd, logins, groupAddUpdate, loginsAdd, groupGet, passwordReset } from 'api/account/index'
import { Button } from 'ant-design-vue';
import LocaleChange from '@/components/LocaleChange.vue'
import { useRouter } from "vue-router";
import { reactive, ref } from 'vue';

const router = useRouter()

const states = reactive({
  login: 3241,
  password: 'abc111'
});
const token = ref();
const login = () => {
  Login({
    password: states.password,
    login: states.login
  }).then((res: any) => {
    token.value = res.data.token;
    console.log('token.value', token.value)
  })
}
const balanceAdd = () => {
  balanceOrdersAdd({
    token: token.value,
    "login": "3241"
    , "password": "abc111"
    , "orders":
      [
        {
          "login": 124000001
          , "profit": 100000
          , "comment": "Deposit"
        }
      ]
  }).then((res: any) => {
    router.push({ name: 'chart' })
  })
}

const addLogins = () => {
  loginsAdd({
    token: token.value,
    "login": "3241",
    "logins":
      [
        '15800252312'
      ],
      "group": "A1"
  })
}

const groupAdd = () => {
  groupAddUpdate({
    token: token.value,
    "login": "3241",
    "groups": [{
      "group": "A1"
      , "status": 1
      , "trade_rights": 1
      , "safe_margin_level": 30
      , "orders_limit": 50
    }]
  })
}

const watchlogins = () => {
  logins({
    token: token.value,
    "login":"3241",
    // logins: [124000000 , 124000001]
  })
}
const getGroup = () => {
  groupGet({
    token: token.value,
    "login":"3241"
  })
}
const resetPassword = () => {
  passwordReset({
    token: token.value,
    "login":"3241",
    admin_password: states.password,
    new_password: states.password,
    logins: [124000001, 124000000]
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
    <Button @click="login">{{ $t('account.login') }}</Button>
  </div>
  <div>
    <Button @click="balanceAdd">充钱</Button>
    <Button @click="groupAdd">增加组别</Button>
    <Button @click="getGroup">查看组别</Button>
    <Button @click="addLogins">增加账户</Button>
    <Button @click="watchlogins">查看账户</Button>
    <Button @click="resetPassword">重置用户密码</Button>
  </div>
</template>
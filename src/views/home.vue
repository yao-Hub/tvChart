<script setup lang="ts">
import { allSymbols } from 'api/symbols/index'
import { Button } from 'ant-design-vue';
import LocaleChange from '@/components/LocaleChange.vue'
import { useRouter } from "vue-router";

const router = useRouter()
// import useUserStore from '@/store/modules/user'
// const userStore = useUserStore()
// userStore.changeUserName({
//   userName: 'haha',
//   userId: 123
// })

const getSymbols = () => {
  allSymbols({ server: 'upway-live' }).then(res => {
    console.log('getAllSymbols', res)
  })
}

</script>

<template>
  <LocaleChange></LocaleChange>
  <Button @click="getSymbols">{{ $t('Send request') }}</Button>
  <a-date-picker />
  <!-- <Button @click="router.push({ name: 'login' })">{{ $t('login') }}</Button> -->
  <Button @click="router.push({ name: 'chart' })">charts</Button>
</template>
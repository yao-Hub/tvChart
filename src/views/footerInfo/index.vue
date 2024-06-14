<template>
  <div class="footerInfo">
    <div v-for="item in state.list" :key="item.label" class="item">
      <span>{{ item.label }}：</span>
      <span>{{ loginInfo ? loginInfo[item.prop as keyof UserInfo]??'-' : '-' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useUser } from '@/store/modules/user';
import { UserInfo } from '#/store';

const userStore = useUser();

const loginInfo = computed(() => userStore.loginInfo);

const state = reactive({
  list: [
    { label: '余额', prop: 'balance' },
    { label: '净值', prop: 'equity' },
    { label: '保证金', prop: 'margin' },
    { label: '可用保证金', prop: 'margin_free' },
    { label: '保证金水平', prop: 'margin_level' },
    // { label: '智能止损离场', prop: 'balance' },
    // { label: 'Unr. Net P&L:', prop: 'balance' },
  ]
});

</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.footerInfo {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  height: 30px;
  @include background_color('primary');
  .item {
    flex: 1;
    border-right: 1px solid;
    @include border_color('border');
    display: flex;
    align-items: center;
    padding-left: 20px;
    height: 80%;
  }
}
</style>

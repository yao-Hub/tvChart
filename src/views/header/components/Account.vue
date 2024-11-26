<template>
  <el-dropdown trigger="click">
    <div class="info">
      <div class="left">
        <div class="top">
          <span>{{ networkStore.currentNode?.nodeName }}</span>
          <div class="divider"></div>
          <span>{{ userStore.account.login }}</span>
        </div>
        <span class="balance">{{ userStore.loginInfo?.balance }}</span>
      </div>
      <img class="caretDownIcon" src="@/assets/icons/caretDown.svg" />
    </div>
    <template #dropdown>
      <div class="aList">
        <div
          class="aItem"
          v-for="item in accounts"
          :class="{ aItemActive: item.ifLogin }"
          @click="changeLogin(item)"
          @mouseover="item.hover = true"
          @mouseleave="item.hover = false"
        >
          <img class="icon" :src="getLogo(item.server)" />
          <span>{{ item.server }}</span>
          <span>|</span>
          <span>{{ item.login }}</span>
          <span>|</span>
          <span>{{ item.blance }}</span>
          <div
            class="delIcon"
            v-if="item.hover && !item.ifLogin"
            @click.stop="delAccount(item)"
          ></div>
        </div>
      </div>
      <div class="account">
        <span @click="modalOpen = true">个人信息</span>
        <el-divider direction="vertical" />
        <span @click="resetPasswordOpen = true">更改密码</span>
        <el-divider direction="vertical" />
        <span @click="$router.push({ name: 'login' })">添加账号</span>
        <el-divider direction="vertical" />
        <span @click="logout">退出登录</span>
      </div>
    </template>
  </el-dropdown>

  <el-dialog v-model="modalOpen" width="486" :zIndex="10" destroy-on-close>
    <template #header>
      <span class="header">个人信息</span>
    </template>
    <el-row>
      <el-col :span="24">
        <el-text type="info">经纪商名称</el-text>
        <el-text>{{ networkStore.currentLine?.brokerName }}</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">线路名称</el-text>
        <el-text>{{ networkStore.nodeName }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">登录id</el-text>
        <el-text>{{}}</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">服务器</el-text>
        <el-text>{{ networkStore.currentNode?.ip }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">已连接节点</el-text>
        <el-text>{{ networkStore.currentNode?.nodeName }}</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <el-text type="info">邮箱地址</el-text>
        <el-text></el-text>
      </el-col>
    </el-row>
  </el-dialog>

  <ResetPassword v-model:open="resetPasswordOpen"></ResetPassword>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";
import { useChartInit } from "@/store/modules/chartInit";

import ResetPassword from "@/views/login/components/ResetPassword.vue";
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
const chartInitStore = useChartInit();
const userStore = useUser();
const router = useRouter();

const accounts = ref<any[]>([]);
watch(
  () => userStore.accountList,
  (list) => {
    if (list) {
      accounts.value = userStore.accountList.map((item) => {
        return {
          ...item,
          hover: false,
        };
      });
    }
  },
  { deep: true }
);
const delAccount = (account: any) => {
  userStore.removeAccount(account);
};

const changeLogin = (account: any) => {
  const { login, password, server, ifLogin, remember } = account;
  if (ifLogin) {
    return;
  }
  if (!remember) {
    router.push({
      path: "/login",
      query: { login, server },
    });
    return;
  }
  chartInitStore.saveCharts();
  setTimeout(async () => {
    userStore.accountList.forEach((item) => {
      item.ifLogin = item.login === login && item.server === server;
    });
    await userStore.login({
      login,
      password,
      server,
    });
    chartInitStore.refresh();
  }, 200);
};

const logout = () => {
  userStore.logoutCurrentAccount();
  router.replace({ name: "login" });
};

const getLogo = (server: string) => {
  let result = "@/assets/icons/logo@3x.png";
  const target = networkStore.queryTradeLines.find(
    (e) => e.lineName === server
  );
  if (target && target.lineLogo) {
    result = target.lineLogo;
  }
  return result;
};

const modalOpen = ref<boolean>(false);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.info {
  display: flex;
  height: 48px;
  margin-right: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  box-sizing: border-box;
  cursor: pointer;
  .left {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    text-align: right;

    .top {
      display: flex;
      align-items: center;
    }
    .balance {
      @include font_color("primary");
      font-weight: 500;
    }
  }
  .divider {
    margin: 0 4px;
    width: 1px;
    height: 12px;
    @include background_color("border");
  }
}

.aList {
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  @include background_color("background-dialog");

  .aItem {
    width: 384px;
    height: 40px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    box-sizing: border-box;
    gap: 4px;
    cursor: pointer;
    &:hover {
      @include background_color("background-hover");
    }
    &:active {
      @include background_color("background-active");
    }
    .icon {
      width: 20px;
      height: 20px;
      border-radius: 44px;
    }
    .delIcon {
      width: 18px;
      height: 18px;
      margin-left: auto;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url("@/assets/icons/delete.svg");
      &:hover {
        background-image: url("@/assets/icons/deleteHover.svg");
      }
    }
  }
  .aItemActive {
    @include background_color("background-active");
  }
}

.account {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 5px;
  border-top: 1px solid;
  padding: 0 16px;
  @include background_color("background-dialog");
  @include font_color("word-gray");
  @include border_color("border");
  span {
    cursor: pointer;
    white-space: nowrap;
    &:hover {
      @include font_color("primary");
    }
    &:last-child {
      color: #dc1d43;
    }
  }
}

.header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}

.el-row {
  margin-bottom: 16px;
}
.el-row:first-child {
  margin-top: 20px;
}
:deep(.el-dropdown-menu__item) {
  margin: 0 8px;
  border-radius: 4px;
  padding: 0;
}
:deep(.el-text.el-text--info) {
  width: 90px;
  display: inline-block;
}
</style>

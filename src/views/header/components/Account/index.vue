<template>
  <el-dropdown trigger="click">
    <div class="info">
      <span
        >{{ networkStore.currentNode?.nodeName }},{{
          userStore.loginInfo?.total_name || userStore.account.login
        }}</span
      >
      <div class="blance">
        <span>{{ userStore.loginInfo?.balance }}</span>
        <CaretDownOutlined />
      </div>
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
          <img class="icon" src="@/assets/icons/logo@3x.png" />
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
        <span class="label">经纪商名称：</span>
        <span class="value">{{ networkStore.currentLine?.brokerName }}</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <span class="label">线路名称：</span>
        <span class="value">{{ networkStore.nodeName }}</span>
      </el-col>
      <el-col :span="12">
        <span class="label">登录id：</span>
        <span class="value"></span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <span class="label">服务器：</span>
        <span class="value">{{ networkStore.currentNode?.ip }}</span>
      </el-col>
      <el-col :span="12">
        <span class="label">已连接节点：</span>
        <span class="value">{{ networkStore.currentNode?.nodeName }}</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="24">
        <span class="label">邮箱地址：</span>
        <span class="value"></span>
      </el-col>
    </el-row>
  </el-dialog>

  <ResetPassword v-model:open="resetPasswordOpen"></ResetPassword>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { CaretDownOutlined } from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import ResetPassword from "@/views/login/components/ResetPassword.vue";
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
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

const changeLogin = async (account: any) => {
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
  userStore.accountList.forEach((item) => {
    item.ifLogin = item.login === login && item.server === server;
  });
  await userStore.login({
    login,
    password,
    server,
  });
  window.location.reload();
};

const logout = () => {
  userStore.logoutCurrentAccount();
  router.replace({ name: "login" });
};

const modalOpen = ref<boolean>(false);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.info {
  height: 100%;
  margin-right: 13px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  font-size: var(--font-size);
  gap: 6px;
}
.blance {
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  &:hover {
    @include font_color("primary");
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
    font-size: var(--font-size);
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
  font-size: var(--font-size);
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
.label {
  @include font_color("word-gray");
  font-weight: 400;
  font-size: var(--font-size);
}
.value {
  @include font_color("word");
  font-weight: 400;
  font-size: var(--font-size);
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
</style>

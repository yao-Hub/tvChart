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
      <el-dropdown-menu>
        <el-dropdown-item v-for="item in userStore.accountList">
          <div
            :class="[
              item.login === userStore.account.login
                ? 'item item_active'
                : 'item',
            ]"
            @click="changeLogin(item.login)"
          >
            <!-- <GlobalOutlined class="icon" /> -->
            <img class="icon" src="@/assets/icons/logo@3x.png" />
            <span class="word">{{ item.server }}</span>
            <span class="divider">|</span>
            <span class="word">{{ item.login }}</span>
            <span class="divider">|</span>
            <span>{{ item.blance }}</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
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
import { ref } from "vue";
import { CaretDownOutlined } from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import ResetPassword from "@/views/login/components/ResetPassword.vue";
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
const userStore = useUser();
const router = useRouter();

const changeLogin = async (login: string) => {
  if (login === userStore.account.login) {
    return;
  }
  const account = userStore.accountList.find((item) => item.login === login);
  if (account) {
    const { login, password, server } = account;
    await userStore.login({
      login,
      password,
      server,
    });
    window.location.reload();
  }
};

const logout = () => {
  userStore.clearToken();
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
  font-size: 12px;
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
.item {
  display: flex;
  gap: 2px;
  align-items: center;
  border-radius: 4px;
  width: 324px;
  height: 40px;
  padding: 0 16px;
  &_active {
    @include background_color("primary");
  }
  .icon {
    margin-right: 5px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .word {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    @include font_color("word");
  }
  .divider {
    margin: 0 10px;
  }
}
.account {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 5px;
  margin-top: 24px;
  border-top: 1px solid;
  padding: 0 16px;
  @include font_color("word-gray");
  @include border_color("border");
  span {
    cursor: pointer;
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
  font-size: 14px;
}
.value {
  @include font_color("word");
  font-weight: 400;
  font-size: 14px;
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

<template>
  <a-dropdown :trigger="['click']" v-model:open="visible">
    <div class="info">
      <span
        >{{ networkStore.currentNode?.nodeName }},
        {{ userStore.loginInfo?.total_name || userStore.account.login }}</span
      >
      <a-flex justify="space-between" class="blance" @click="visible = true">
        <span>{{ userStore.loginInfo?.balance }}</span>
        <CaretDownOutlined />
      </a-flex>
    </div>
    <template #overlay>
      <a-menu @click="handleMenuClick">
        <div
          v-for="item in userStore.accountList"
          :key="item.login"
          class="item"
        >
          <a-menu-item :key="item.login">
            <a-flex align="center" :gap="5">
              <GlobalOutlined />
              <span class="menuItem">{{ item.server }}</span>
              <a-divider type="vertical" />
              <span class="menuItem">{{ item.login }}</span>
              <a-divider type="vertical" />
              <span>{{ item.blance }}</span>
              <CheckOutlined v-show="item.login === userStore.account.login" style="margin-left: auto;"/>
            </a-flex>
          </a-menu-item>
          <a-menu-divider />
        </div>
        <a-menu-item>
          <a-flex justify="space-between" align="center" :gap="5">
            <span class="btn" @click="showModal">个人信息</span>
            <a-divider type="vertical" />
            <span class="btn" @click="resetPasswordOpen = true">更改密码</span>
            <a-divider type="vertical" />
            <span class="btn" @click="$router.push({ name: 'login' })"
              >添加账号</span
            >
            <a-divider type="vertical" />
            <span class="btn logout" @click="logout">退出登录</span>
          </a-flex>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>

  <a-modal v-model:open="modalOpen" title="个人信息" @ok="handleOk">
    <div class="personalInfo">
      <p>经纪商名称: {{ networkStore.currentLine?.brokerName }}</p>
      <p>线路名称: {{ networkStore.nodeName }}</p>
      <p>登录id:</p>
      <p>服务器: {{ networkStore.currentNode?.ip }}</p>
      <p>已连接节点: {{ networkStore.currentNode?.nodeName }}</p>
      <p>邮箱地址:</p>
    </div>
  </a-modal>

  <ResetPassword v-model:open="resetPasswordOpen"></ResetPassword>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CaretDownOutlined, GlobalOutlined, CheckOutlined } from "@ant-design/icons-vue";
import type { MenuProps } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

import ResetPassword from "@/views/login/components/ResetPassword.vue"
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
const userStore = useUser();
const router = useRouter();

const visible = ref(false);
const handleMenuClick: MenuProps["onClick"] = async (e) => {
  visible.value = false;
  if (e.key === userStore.account.login) {
    return;
  }
  const account = userStore.accountList.find((item) => item.login === e.key);
  if (account) {
    const { login, password, server } = account;
    await networkStore.getNodes(server);
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
const showModal = () => {
  modalOpen.value = true;
};
const handleOk = () => {
  modalOpen.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.info {
  height: 100%;
  margin-right: 13px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  font-size: 12px;
}
.item {
  border-radius: 4px;
  &:active {
    @include background_color("primary");
  }
}
.blance {
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
.menuItem {
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ant-divider {
  @include background_color("border");
}
.btn {
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
.logout {
  color: #dc1d43;
}
.personalInfo {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  p {
    width: calc(50% - 15px);
  }
}
</style>

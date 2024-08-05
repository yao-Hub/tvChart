<template>
  <a-dropdown :trigger="['click']" v-model:open="state.visible">
    <div class="item">
      <span>线路名</span>
      <span>账户名</span>
      <span>10285.21</span>
      <CaretDownOutlined />
    </div>
    <template #overlay>
      <a-menu @click="handleMenuClick">
        <div v-for="i in 3" :key="i">
          <a-menu-item>
            <div class="item">
              <GlobalOutlined />
              <span>线路名</span>
              <a-divider type="vertical" />
              <span>账户名</span>
              <a-divider type="vertical" />
              <span>10285.21</span>
            </div>
          </a-menu-item>
          <a-menu-divider />
        </div>
        <a-menu-item>
          <div class="item">
            <a-button type="link" @click="showModal">个人信息</a-button>
            <a-button
              type="link"
              @click="$router.push({ name: 'resetPassword' })"
              >更改密码</a-button
            >
            <a-button danger size="small" @click="logout">退出</a-button>
          </div>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>

  <a-modal v-model:open="open" title="个人信息" @ok="handleOk">
    <p>经纪商名称:</p>
    <p>线路名称:</p>
    <p>登录id:</p>
    <p>服务器:</p>
    <p>已连接节点:</p>
    <p>邮箱地址:</p>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { CaretDownOutlined, GlobalOutlined } from "@ant-design/icons-vue";
import type { MenuProps } from "ant-design-vue";
import { useUser } from "@/store/modules/user";
import { useRouter } from "vue-router";

const userStore = useUser();
const router = useRouter();

const state = reactive({
  visible: false,
});

const handleMenuClick: MenuProps["onClick"] = () => {
  state.visible = false;
};

const logout = () => {
  userStore.clearToken();
  router.replace({ name: "login" });
};

const open = ref<boolean>(false);
const showModal = () => {
  open.value = true;
};
const handleOk = () => {
  open.value = false;
};
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
}
</style>

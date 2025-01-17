<template>
  <el-dropdown
    trigger="contextmenu"
    ref="dropdown"
    @visible-change="visible = $event"
  >
    <div class="info" @click="toogleDropdown">
      <div class="left">
        <div class="top">
          <el-text>{{ networkStore.server }}</el-text>
          <el-divider direction="vertical" />
          <el-text>{{ userStore.account.login }}</el-text>
        </div>
        <el-text class="balance"
          >{{ userStore.loginInfo?.balance }}
          {{ userStore.loginInfo?.currency }}</el-text
        >
      </div>
      <BaseImg class="caretDownIcon" iconName="caretDown" />
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
          <BaseImg class="icon" :fullPath="getLogo(item.server)" />
          <span>{{ item.server }}</span>
          <span>|</span>
          <span>{{ item.login }}</span>
          <span>|</span>
          <span>{{ item.blance }}</span>
          <div class="del" @click.stop="delAccount(item)">
            <div class="delIcon" v-show="item.hover && !item.ifLogin"></div>
          </div>
        </div>
      </div>
      <div class="account">
        <el-text type="info" @click="showModal">{{
          $t("personalInformation")
        }}</el-text>
        <el-divider direction="vertical" />
        <el-text type="info" v-if="ifSimulatedServer" @click="openResetPwd">{{
          $t("changePassword")
        }}</el-text>
        <el-divider direction="vertical" v-if="ifSimulatedServer" />
        <el-text
          type="info"
          @click="$router.push({ path: PageEnum.LOGIN_HOME })"
          >{{ $t("addAccount") }}</el-text
        >
        <el-divider direction="vertical" />
        <span @click="logout">{{ $t("logOut") }}</span>
      </div>
    </template>
  </el-dropdown>

  <el-dialog
    v-if="modalOpen"
    v-model="modalOpen"
    width="486"
    :zIndex="dialogStore.zIndex"
    destroy-on-close
  >
    <template #header>
      <span class="header">{{ $t("personalInformation") }}</span>
    </template>
    <el-row>
      <el-col :span="24">
        <el-text type="info">{{ $t("brokerName") }}</el-text>
        <el-text>{{ networkStore.currentLine?.brokerName }}</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">{{ $t("nodeName") }}</el-text>
        <el-text>{{ networkStore.nodeName }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">{{ $t("loginId") }}</el-text>
        <el-text>{{ userStore.loginInfo?.login }}</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">{{ $t("ip") }}</el-text>
        <el-text>{{ networkStore.currentNode?.ip }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">{{ $t("connectedNode") }}</el-text>
        <el-text>{{ networkStore.currentNode?.nodeName }}</el-text>
      </el-col>
    </el-row>
  </el-dialog>

  <ResetPassword v-model:open="resetPasswordOpen"></ResetPassword>
</template>

<script setup lang="ts">
import { PageEnum } from "@/constants/pageEnum";
import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";
import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import type { DropdownInstance } from "element-plus";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

import ResetPassword from "@/views/login/components/ResetPassword.vue";

const dropdown = ref<DropdownInstance>();
const visible = ref(false);
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
const chartInitStore = useChartInit();
const userStore = useUser();
const router = useRouter();
const dialogStore = useDialog();

const accounts = ref<any[]>([]);

// 是否是官方模拟服务器
const ifSimulatedServer = computed(() => {
  if (networkStore.server) {
    const target = networkStore.queryTradeLines.find(
      (e) => e.lineName === networkStore.server
    );
    if (target) {
      return target.isOfficial === "1";
    }
    return false;
  }
  return false;
});

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

const toogleDropdown = () => {
  if (!dropdown.value) return;
  if (visible.value) {
    dropdown.value.handleClose();
  } else {
    dropdown.value.handleOpen();
  }
};

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
      path: PageEnum.LOGIN_HOME,
      query: { login, server },
    });
    return;
  }
  chartInitStore.saveCharts();
  toogleDropdown();
  chartInitStore.state.loading = true;
  userStore.login(
    {
      login,
      password,
      server,
    },
    ({ ending, success }) => {
      if (ending) {
        if (success) {
          chartInitStore.systemRefresh();
        } else {
          chartInitStore.state.loading = false;
          router.push({
            path: PageEnum.LOGIN_HOME,
            query: { login, server },
          });
        }
      }
    }
  );
};

const logout = () => {
  userStore.Logout();
  router.replace({ path: PageEnum.LOGIN });
};

const getLogo = (server: string) => {
  let result = "";
  const target = networkStore.queryTradeLines.find(
    (e) => e.lineName === server
  );
  if (target && target.lineLogo) {
    result = target.lineLogo;
  }
  return result;
};

const modalOpen = ref<boolean>(false);
const showModal = () => {
  toogleDropdown();
  dialogStore.incrementZIndex();
  modalOpen.value = true;
};

const openResetPwd = () => {
  toogleDropdown();
  dialogStore.incrementZIndex();
  resetPasswordOpen.value = true;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.delIcon {
  width: 18px;
  height: 18px;
  background-size: contain;
  background-repeat: no-repeat;
}
[data-theme="light"] .delIcon {
  background-image: url("@/assets/icons/light/delete.svg");
  &:hover {
    background-image: url("@/assets/icons/light/deleteHover.svg");
  }
}
[data-theme="dark"] .delIcon {
  background-image: url("@/assets/icons/dark/delete.svg");
  &:hover {
    background-image: url("@/assets/icons/dark/deleteHover.svg");
  }
}

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
    justify-content: center;
    align-items: flex-end;
    gap: 4px;
    height: 100%;

    .top {
      display: flex;
      align-items: center;
    }

    .balance {
      font-weight: 500;
      text-align: right;
      display: block;
      width: 100%;
    }
  }
}

.aList {
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  @include background_color("background-dialog");

  .aItem {
    width: 100%;
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
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 120px;
    }
    .icon {
      width: 20px;
      height: 20px;
      border-radius: 44px;
    }
    .del {
      width: 18px;
      height: 18px;
      margin-left: auto;
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
  min-width: 90px;
  display: inline-block;
}
</style>

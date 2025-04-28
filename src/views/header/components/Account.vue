<template>
  <el-dropdown
    trigger="contextmenu"
    ref="dropdown"
    @visible-change="visible = $event"
  >
    <div class="info" @click="toogleDropdown">
      <el-text>{{ networkStore.server }}</el-text>
      <el-divider direction="vertical" />
      <el-text>{{ userStore.account.login }}</el-text>
      <BaseImg class="caretDownIcon" iconName="caretDown" />
    </div>
    <template #dropdown>
      <div class="aList">
        <div
          class="aItem"
          v-for="(item, index) in accounts"
          :class="{ aItemActive: item.ifLogin }"
          @click="changeLogin(item)"
          @mouseover="hoverMap[index] = true"
          @mouseleave="hoverMap[index] = false"
        >
          <BaseImg class="icon" :fullPath="getLogo(item.server)" />
          <span>{{ item.server }}</span>
          <span>|</span>
          <span>{{ item.login }}</span>
          <span>|</span>
          <span>{{ item.blance }}</span>
          <span>|</span>
          <span>{{ item.currency }}</span>
          <div class="del" @click.stop="delAccount(item)">
            <div
              class="delIcon"
              v-show="hoverMap[index] && !item.ifLogin"
            ></div>
          </div>
        </div>
      </div>
      <div class="account">
        <el-text type="info" @click="showModal">{{
          t("personalInformation")
        }}</el-text>
        <el-divider direction="vertical" />
        <el-text type="info" @click="openResetPwd">{{
          t("changePassword")
        }}</el-text>
        <el-divider direction="vertical" />
        <el-text
          type="info"
          @click="$router.push({ path: PageEnum.LOGIN_HOME })"
          >{{ t("addAccount") }}</el-text
        >
        <el-divider direction="vertical" />
        <span @click="logout">{{ t("logOut") }}</span>
      </div>
    </template>
  </el-dropdown>

  <el-dialog
    v-if="modalOpen"
    v-model="modalOpen"
    width="486"
    :zIndex="dialogStore.zIndex"
    destroy-on-close
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{
          t("personalInformation")
        }}</span>
        <el-icon class="closeBtn" @click="close">
          <Close />
        </el-icon>
      </div>
    </template>

    <table>
      <tr>
        <td>
          <el-text type="info">{{ t("brokerName") }}</el-text>
        </td>
        <td>
          <el-text type="primary" @click="showServerDialog">
            {{ networkStore.currentLine?.brokerName }}
          </el-text>
        </td>
      </tr>
      <tr>
        <td>
          <el-text type="info">{{ t("nodeName") }}</el-text>
        </td>
        <td>
          <el-text>{{ networkStore.currentLine?.lineName }}</el-text>
        </td>
      </tr>
      <tr>
        <td>
          <el-text type="info">{{ t("loginId") }}</el-text>
        </td>
        <td>
          <el-text>{{ userStore.state.loginInfo?.login }}</el-text>
        </td>
      </tr>
      <tr>
        <td>
          <el-text type="info">{{ t("ip") }}</el-text>
        </td>
        <td>
          <el-text>{{ networkStore.currentNode?.ip }}</el-text>
        </td>
      </tr>
      <tr>
        <td>
          <el-text type="info">{{ t("connectedNode") }}</el-text>
        </td>
        <td>
          <el-text>{{ networkStore.currentNode?.nodeName }}</el-text>
        </td>
      </tr>
    </table>
  </el-dialog>

  <ResetPassword v-model:open="resetPasswordOpen"></ResetPassword>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import type { DropdownInstance } from "element-plus";

import plugins from "@/plugins/propsComponents";

import { PageEnum } from "@/constants/pageEnum";

import { useDialog } from "@/store/modules/dialog";
import { useNetwork } from "@/store/modules/network";
import { AccountListItem, useUser } from "@/store/modules/user";

import ResetPassword from "@/views/login/components/ResetPassword.vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const dropdown = ref<DropdownInstance>();
const visible = ref(false);
const resetPasswordOpen = ref(false);

const networkStore = useNetwork();
const userStore = useUser();
const router = useRouter();
const dialogStore = useDialog();

const accounts = computed(() => userStore.state.accountList);
const hoverMap = reactive<{
  [key: number]: boolean;
}>({});

const toogleDropdown = () => {
  if (!dropdown.value) return;
  if (visible.value) {
    dropdown.value.handleClose();
  } else {
    dropdown.value.handleOpen();
  }
};

const delAccount = (account: AccountListItem) => {
  userStore.removeAccount(account);
};

const changeLogin = (account: AccountListItem) => {
  const { login, server, ifLogin } = account;
  if (ifLogin) {
    return;
  }
  router.push({
    path: PageEnum.LOGIN_HOME,
    query: { login, server },
  });

  // if (!remember) {
  //   router.push({
  //     path: PageEnum.LOGIN_HOME,
  //     query: { login, server },
  //   });
  //   return;
  // }
  // chartInitStore.saveCharts();
  // toogleDropdown();
  // chartInitStore.state.loading = true;
  // userStore.login(
  //   {
  //     login,
  //     password,
  //     server,
  //   },
  //   ({ ending, success }) => {
  //     if (ending) {
  //       if (success) {
  //         chartInitStore.systemRefresh();
  //       } else {
  //         chartInitStore.state.loading = false;
  //         router.push({
  //           path: PageEnum.LOGIN_HOME,
  //           query: { login, server },
  //         });
  //       }
  //     }
  //   }
  // );
};

const logout = async () => {
  await userStore.logout();
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

const showServerDialog = () => {
  plugins.serverInfoPlugin.mount({
    server: networkStore.currentLine?.brokerName,
  });
  dialogStore.openDialog("serverVisible");
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

:deep(.el-dropdown-menu__item) {
  margin: 0 8px;
  border-radius: 4px;
  padding: 0;
}

:deep(.el-text.el-text--info) {
  display: inline-block;
}

table {
  margin: 24px 0 12px 0;

  tr {
    height: 36px;

    td:first-child {
      word-wrap: break-word;
      white-space: nowrap;
    }

    td {
      padding-right: 8px;
      vertical-align: middle;
    }
  }
}
</style>

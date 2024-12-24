<template>
  <div class="accounts">
    <span class="plogin">{{ $t("logAccount") }}</span>
    <span class="padd">{{ $t("noAccount") }}</span>

    <div class="list">
      <el-scrollbar always :height="Math.min(list.length, 3) * 56">
        <div
          class="item"
          v-for="account in list"
          @click="selectAccount(account)"
        >
          <div class="item_left">
            <BaseImg class="icon" :fullPath="getLogo(account.server)" />
            <span class="textEllipsis">{{ account.server }}</span>
            <span class="textEllipsis">{{ account.login }}</span>
          </div>
          <div class="item_right">
            <el-icon v-if="account.actived && !ifOpera">
              <BaseImg iconName="select" />
            </el-icon>
            <div
              class="delIcon"
              v-if="ifOpera && !account.ifLogin"
              @click.stop="delAccount(account)"
            ></div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <el-button
      class="btn"
      type="primary"
      :loading="loading"
      @click="happyStart"
      >{{ ifOpera ? $t("done") : $t("account.login") }}</el-button
    >

    <div class="footer">
      <span @click="goLogin()">{{ $t("addAccount") }}</span>
      <el-divider direction="vertical" />
      <span @click="ifOpera = true">{{ $t("manageAccount") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PageEnum } from "@/constants/pageEnum";
import { AccountListItem, useUser } from "@/store/modules/user";
import { orderBy } from "lodash";
import { onBeforeMount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const userStore = useUser();

type TList = AccountListItem & { actived: boolean };

const list = ref<TList[]>([]);

onBeforeMount(() => {
  const accounts = userStore.accountList;
  if (accounts.length === 0) {
    router.replace({ path: PageEnum.LOGIN_HOME });
  }
});

const initList = () => {
  const accounts = userStore.accountList;
  const orderAccounts = orderBy(accounts, ["ifLogin"], ["desc"]);
  list.value = orderAccounts.map((item, index) => {
    return {
      ...item,
      actived: index === 0,
    };
  });
};
initList();

const ifOpera = ref(false);

const selectAccount = (e: any) => {
  if (ifOpera.value) {
    return;
  }
  list.value.forEach((item) => {
    item.actived = item.login === e.login;
  });
};

const delAccount = (e: any) => {
  userStore.removeAccount(e);
  initList();
  if (list.value.length === 0) {
    goLogin();
  }
};

const loading = ref(false);
const emit = defineEmits(["goCom", "goHome"]);
const happyStart = async () => {
  try {
    if (ifOpera.value) {
      ifOpera.value = false;
      return;
    }
    const account = list.value.find((item) => item.actived);
    if (account && account.remember) {
      await userStore.login(account, ({ ending }) => {
        loading.value = !ending;
      });
      router.push({ path: PageEnum.CHART });
    } else {
      goLogin(account);
    }
  } catch (e) {
    loading.value = false;
  }
};

import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();
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

const goLogin = (account?: { login: string; server: string }) => {
  router.push({ path: PageEnum.LOGIN_HOME, query: account });
};

onMounted(() => {
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      happyStart();
    }
  });
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.accounts {
  padding: 56px;
  position: relative;
  .plogin {
    font-weight: bold;
    font-size: 28px;
    height: 40px;
    line-height: 40px;
    display: block;
  }
  .padd {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    display: block;
    @include font_color("word-gray");
  }
  .list {
    margin-top: 40px;
    max-height: 168px;
    border: 1px solid;
    border-radius: 4px;
    @include border_color("border");
    overflow: hidden;
  }
  .item {
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 56px;
    padding: 0 24px;
    font-size: 14px;
    cursor: pointer;
    &_left {
      display: flex;
      gap: 4px;
      align-items: center;
      span {
        max-width: 120px;
        padding-right: 8px;
        margin-right: 8px;
        display: block;
        border-right: 1px solid;
        @include border_color("word");
        &:last-child {
          border: none;
        }
      }

      .icon {
        border-radius: 50%;
        width: 20px;
        height: 20px;
      }
    }
    &:hover {
      @include background_color("background-hover");
    }
  }
  .btn {
    margin-top: 40px;
    height: 56px;
    width: 100%;
    font-size: 16px;
    font-weight: 400;
  }

  .footer {
    margin-top: 152px;
    display: flex;
    justify-content: center;
    gap: 24px;
    width: 100%;
    font-size: 14px;
    font-weight: 400;
    span {
      cursor: pointer;
      &:hover {
        @include font_color("primary");
      }
      &:active {
        @include font_color("primary-active");
      }
    }
  }
}

.delIcon {
  width: 18px;
  height: 18px;
  background-size: contain;
  background-repeat: no-repeat;
  &:hover {
    background-image: url("@/assets/icons/light/deleteHover.svg");
  }
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
</style>

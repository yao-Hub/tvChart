<template>
  <div class="accounts scrollList">
    <span class="plogin">{{ t("logAccount") }}</span>
    <span class="padd">{{ t("noAccount") }}</span>

    <div class="list">
      <el-scrollbar always :height="Math.min(list.length, 3) * 56">
        <div
          class="item"
          v-for="(account, index) in list"
          @click="selectAccount(index)"
        >
          <div class="item_left">
            <img :src="logoMap[account.server] || ''" class="icon" />
            <span class="textEllipsis">{{ account.server }}</span>
            <span class="textEllipsis">{{ account.login }}</span>
          </div>
          <div class="item_right">
            <el-icon v-if="account.actived && !ifOpera">
              <BaseImg iconName="select" />
            </el-icon>
            <el-icon v-if="ifOpera" @click.stop="delAccount(account)">
              <BaseImg iconName="delete" />
            </el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <el-button
      class="btn"
      type="primary"
      :loading="loading"
      @click="happyStart"
    >
      <span class="btnText">{{
        ifOpera ? t("done") : t("account.login")
      }}</span></el-button
    >

    <div class="footer">
      <span @click="goLogin()">{{ t("addAccount") }}</span>
      <el-divider direction="vertical" />
      <span @click="ifOpera = true">{{ t("manageAccount") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { orderBy } from "lodash";
import { useI18n } from "vue-i18n";

import { PageEnum } from "@/constants/pageEnum";

import { AccountListItem, useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

const { t } = useI18n();
const router = useRouter();

const networkStore = useNetwork();
const userStore = useUser();

type TList = AccountListItem & { actived: boolean };

const list = ref<TList[]>([]);
const initList = () => {
  const accounts = userStore.state.accountList;
  const orderAccounts = orderBy(accounts, ["ifLogin"], ["desc"]);
  list.value = orderAccounts.map((item, index) => {
    return {
      ...item,
      actived: index === 0,
    };
  });
};

const ifOpera = ref(false);

const selectAccount = (selectIndex: number) => {
  if (ifOpera.value) {
    return;
  }
  list.value.forEach((item, index) => {
    item.actived = index === selectIndex;
  });
};

const delAccount = (e: any) => {
  userStore.removeAccount(e);
  initList();
  if (list.value.length === 0) {
    goLogin();
  }
};

const logoMap = computed(() => {
  const obj: Record<string, string> = {};
  networkStore.queryTradeLines.forEach((item) => {
    obj[item.lineName] = item.lineLogo;
  });
  return obj;
});

const goLogin = (account?: { login: string; server: string }) => {
  router.push({ path: PageEnum.LOGIN_HOME, query: account });
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
    if (account) {
      const { login, server } = account;
      // if (remember) {
      //   await userStore.login(account, ({ ending, success }) => {
      //     loading.value = !ending;
      //     if (ending) {
      //       success
      //         ? router.push({ path: PageEnum.CHART })
      //         : goLogin({ login, server });
      //     }
      //   });
      // } else {
      goLogin({ login, server });
      // }
    }
  } catch (e) {
    loading.value = false;
  }
};

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    happyStart();
  }
}

onMounted(() => {
  initList();
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.accounts {
  padding: 32px;
  position: relative;
  height: 100%;
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
  width: 480px;

  .plogin {
    font-size: 24px;
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
    flex-shrink: 0;
    // flex-basis: 1;
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
    line-height: normal;
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
    .btnText {
      font-size: 16px;
      font-weight: 400;
    }
  }

  .footer {
    display: flex;
    justify-content: center;
    gap: 24px;
    width: 100%;
    font-size: 14px;
    box-sizing: border-box;
    height: 80px;
    margin-top: auto;
    align-items: center;
    flex-shrink: 0;
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

.delete {
  @include font_color("word-info");
  &:hover {
    @include font_color("word");
  }
}
</style>

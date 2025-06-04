<template>
  <div class="accountsList">
    <ScanCode></ScanCode>

    <div class="accountsList-container">
      <el-scrollbar always view-style="height:100%">
        <div class="accounts">
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
                  <el-icon v-if="activeIndex === index && !ifOpera">
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
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { orderBy } from "lodash";
import { useI18n } from "vue-i18n";

import { PageEnum } from "@/constants/pageEnum";

import ScanCode from "./ScanCode.vue";

import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

const { t } = useI18n();
const router = useRouter();

const networkStore = useNetwork();
const userStore = useUser();

const activeIndex = ref(0);

const list = computed(() => {
  const accounts = userStore.state.accountList;
  const result = orderBy(accounts, ["ifLogin"], ["desc"]);
  return result;
});

const ifOpera = ref(false);

const selectAccount = (selectIndex: number) => {
  if (ifOpera.value) {
    return;
  }
  activeIndex.value = selectIndex;
};

const delAccount = (e: any) => {
  userStore.removeAccount(e);
  if (activeIndex.value >= list.value.length) {
    activeIndex.value = list.value.length - 1;
  }
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
    const account = list.value[activeIndex.value];
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
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.accountsList {
  display: flex;
  height: 100%;
}
.accountsList-container {
  margin: 32px 0;
}
.accounts {
  height: 100%;
  padding: 0 32px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;

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
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    flex-shrink: 0;
    gap: 24px;
    height: 80px;
    font-size: 14px;
    margin-top: auto;
    padding-bottom: 5px;
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

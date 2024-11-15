<template>
  <div class="accounts">
    <span class="plogin">登录您的账号</span>
    <span class="padd">已有交易账号，可直接登录，如没有，可开模</span>

    <div class="list">
      <el-scrollbar always :height="Math.min(list.length, 3) * 56">
        <div
          class="item"
          v-for="account in list"
          @click="selectAccount(account)"
        >
          <div class="item_left">
            <img class="icon" src="@/assets/icons/logo@3x.png" />
            <span>{{ account.server }} |</span>
            <span>{{ account.login }} |</span>
            <span>{{ account.blance }}</span>
          </div>
          <div class="item_right">
            <el-icon v-if="account.actived && !ifOpera">
              <img src="@/assets/icons/select.svg" />
            </el-icon>
            <div
              class="delIcon"
              v-if="ifOpera"
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
      >{{ ifOpera ? "完成" : $t("account.login") }}</el-button
    >

    <div class="footer">
      <span @click="emit('goCom', 'login', { needBack: true })">添加账号</span>
      <el-divider direction="vertical" />
      <span @click="ifOpera = true">管理账号</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { orderBy } from "lodash";
import { useUser } from "@/store/modules/user";

const userStore = useUser();
const list = ref<any[]>([]);

const initList = () => {
  const accounts: any[] = userStore.accountList;
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
    emit("goCom", "login", { needBack: false });
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
    if (account.remember) {
      await userStore.login(account, ({ ending }) => {
        loading.value = !ending;
      });
      emit("goHome");
    } else {
      emit("goCom", "login", { ...account, needBack: true });
    }
  } catch (e) {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.accounts {
  width: 512px;
  height: 648px;
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
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
    position: absolute;
    bottom: 64px;
    left: 0;
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
        @include font_color("dark-primary");
      }
    }
  }
}

.delIcon {
  width: 18px;
  height: 18px;
  background-size: contain;
  background-repeat: no-repeat;
  background-image: url("@/assets/icons/delete.svg");
  &:hover {
    background-image: url("@/assets/icons/deleteHover.svg");
  }
}
</style>

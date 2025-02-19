<template>
  <div class="home" :key="localeKey">
    <BaseImg class="title" iconName="title" imgSuffix="png" />
    <span class="welcome">{{ $t("welcomeToUTrader") }}</span>
    <div class="functionalArea">
      <Theme></Theme>
      <Language @change=""></Language>
    </div>
    <router-view v-slot="{ Component }">
      <div class="container">
        <transition :name="direction" mode="out-in" appear>
          <div class="main" :key="Component">
            <component :is="Component" />
          </div>
        </transition>
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter } from "vue-router";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { useRoot } from "@/store/store";

import Language from "./components/Language.vue";
import Theme from "./components/Theme.vue";

const router = useRouter();

const networkStore = useNetwork();
const userStore = useUser();
const rootStore = useRoot();

const localeKey = ref("");

(async function init() {
  await rootStore.resetAllStore();
  userStore.initAccount();

  // 查询交易线路列表
  networkStore.getLines();
  const homeComponentImport = () => import("@/views/home/index.vue");
  homeComponentImport();
})();

const direction = ref("slide-forward");
watch(
  () => router.currentRoute.value,
  (to, from) => {
    if (to.meta.depth && from.meta.depth && to.meta.depth > from.meta.depth) {
      direction.value = "slide-forward";
    } else {
      direction.value = "slide-backward";
    }
  }
);
</script>

<style lang="scss" scoped>
:deep(.el-select__wrapper),
:deep(.el-input__wrapper),
:deep(.el-button) {
  height: calc(var(--base-height) + 16px);
}
:deep(.el-select__selected-item span) {
  font-size: calc(var(--font-size) + 2px);
}
:deep(.el-input__inner) {
  font-size: calc(var(--font-size) + 2px);
}
</style>

<style lang="scss">
@import "@/styles/_handle.scss";
[data-theme="light"] .home {
  background-image: url("@/assets/images/light/loginBg@2x.png");
}
[data-theme="dark"] .home {
  background-image: url("@/assets/images/dark/loginBg@2x.png");
}
.goback {
  width: 100%;
  height: 50px;
  @include background_color("background-login-container");
  display: flex;
  align-items: center;
  position: sticky;
  z-index: 9;
  top: 0;
  div {
    display: flex;
    gap: 4px;
    cursor: pointer;
  }
}
.home {
  width: 100vw;
  height: 100vh;
  background-repeat: no-repeat;
  background-size: cover;
  position: relative;
  overflow: hidden;
  .welcome {
    position: fixed;
    left: 18.65%;
    top: 20%;
    font-size: 40px;
    font-weight: bold;
    height: 648px;
  }
  .title {
    position: fixed;
    left: 72px;
    top: 32px;
    width: 176px;
    height: 36px;
  }
  .functionalArea {
    position: fixed;
    top: 4%;
    right: 72px;
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .container {
    position: fixed;
    right: 15%;
    top: 15%;
    width: 30%;
    height: 70%;
    min-width: 270px;
    max-height: 648px;
    max-width: 512px;
    .main {
      width: 100%;
      height: 100%;
      @include background_color("background-login-container");
      @include box-shadow;
      border-radius: 8px;
      box-sizing: border-box;
    }
  }
}

/* 前进动画 */
.slide-forward-enter-active,
.slide-forward-leave-active {
  transition: transform 0.5s ease, opacity 0.2s ease;
}
.slide-forward-enter-from {
  transform: translateX(100%);
  opacity: 1;
}
.slide-forward-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

/* 后退动画 */
.slide-backward-enter-active,
.slide-backward-leave-active {
  transition: transform 0.5s ease, opacity 0.2s ease;
}
.slide-backward-enter-from {
  opacity: 1;
  transform: translateX(-100%);
}
.slide-backward-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>

<template>
  <div class="loginBg">
    <BaseImg iconName="loginBg@2x" imgSuffix="png" catalog="images"></BaseImg>
  </div>
  <div class="home" :key="localeKey">
    <BaseImg iconName="title" />
    <span class="welcome">{{ t("welcomeToUTrader") }}</span>
    <div class="functionalArea">
      <Theme></Theme>
      <Language></Language>
    </div>
    <router-view v-slot="{ Component }">
      <div class="home-container">
        <transition :name="direction" mode="out-in" appear>
          <div class="main" :key="route.path">
            <component :is="Component" />
            <LoginArticle
              class="main-article"
              v-if="showArticle"
            ></LoginArticle>
          </div>
        </transition>
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useInit } from "@/store/modules/init";

import Language from "./components/Language.vue";
import Theme from "./components/Theme.vue";
import LoginArticle from "./components/LoginArticle.vue";

import { useI18n } from "vue-i18n";
import { useNetwork } from "@/store/modules/network";
const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const localeKey = ref("");

(async function foo() {
  await useInit().init();
  await useNetwork().getLines(); //  交易线路
})();

// 预加载home路由
const homeComponentImport = () => import("@/views/home/index.vue");
homeComponentImport();

// 显示底部协议
const checkPath = (path: string) => {
  const patterns = ["/login/home", "/login/accounts"];
  return patterns.some((item) => path.includes(item));
};
const showArticle = computed(() => {
  const path = route.path.toLowerCase();
  return checkPath(path);
});

const direction = ref("");
watch(
  () => router.currentRoute.value,
  (to, from) => {
    const toPath = to.path.toLowerCase();
    const fromPath = from.path.toLowerCase();
    if (checkPath(toPath) && checkPath(fromPath)) {
      direction.value = "";
      return;
    }
    if (to.meta.depth && from.meta.depth && to.meta.depth > from!.meta.depth) {
      direction.value = "slide-forward";
    } else {
      direction.value = "slide-backward";
    }
  }
);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
@import "./form.scss";
@import "./media.scss";

.loginBg {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  @include background_color("loginBg");
  img {
    width: 100%;
    height: 56.25vw;
    min-width: 1000px;
    min-height: calc(1000px / 16 * 9);
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
    font-weight: bold;
    transition: all 0.5s ease;
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
  .home-container {
    position: fixed;
    max-height: 648px;
    height: 70%;
    transition: all 0.5s ease;
    .main {
      width: 100%;
      height: 100%;
      @include background_color("background-login-container");
      @include box-shadow;
      box-sizing: border-box;
      position: relative;
      border-radius: 8px;
      overflow: hidden;
      .main-article {
        position: absolute;
        bottom: 0;
        left: 0;
      }
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

<style lang="scss">
@import "@/styles/_handle.scss";

.goback {
  width: 100%;
  min-height: 50px;
  @include background_color("background-login-container");
  display: flex;
  align-items: center;
  position: sticky;
  z-index: 9;
  top: 0;
  &:hover {
    @include font_color("primary");
  }
  &:active {
    @include font_color("primary-active");
  }
  div {
    display: flex;
    gap: 4px;
    cursor: pointer;
  }
}
</style>

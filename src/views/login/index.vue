<template>
  <div class="home" :key="localeKey">
    <BaseImg class="title" iconName="title" imgSuffix="png" />
    <span class="welcome">{{ t("welcomeToUTrader") }}</span>
    <div class="functionalArea">
      <Theme></Theme>
      <Language></Language>
    </div>
    <router-view v-slot="{ Component }">
      <div class="container">
        <transition :name="direction" mode="out-in" appear>
          <div class="main" :key="routeName">
            <component :is="Component" />
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

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const localeKey = ref("");

useInit().init();

// 预加载home路由
const homeComponentImport = () => import("@/views/home/index.vue");
homeComponentImport();

const routeName = computed(() => route.path);

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
@import "./form.scss";
</style>

<style lang="scss">
@import "@/styles/_handle.scss";
[data-theme="light"] .home {
  // 普通屏幕
  background-image: url("/src/assets/images/light/loginBg@1x.png");

  // 视网膜屏（2倍分辨率）
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    background-image: url("/src/assets/images/light/loginBg@2x.png");
  }
  background-image: -webkit-image-set(
    url("/src/assets/images/light/loginBg@1x.png") 1x,
    url("/src/assets/images/light/loginBg@2x.png") 2x
  );
  // 现代浏览器支持image-set
  background-image: image-set(
    url("/src/assets/images/light/loginBg@1x.png") 1x,
    url("/src/assets/images/light/loginBg@2x.png") 2x
  );
}
[data-theme="dark"] .home {
  background-image: url("/src/assets/images/dark/loginBg@1x.png");
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    background-image: url("/src/assets/images/dark/loginBg@2x.png");
  }
  background-image: -webkit-image-set(
    url("/src/assets/images/dark/loginBg@1x.png") 1x,
    url("/src/assets/images/dark/loginBg@2x.png") 2x
  );
  background-image: image-set(
    url("/src/assets/images/dark/loginBg@1x.png") 1x,
    url("/src/assets/images/dark/loginBg@2x.png") 2x
  );
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
    width: 480px;
    max-height: 648px;
    height: 70%;
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

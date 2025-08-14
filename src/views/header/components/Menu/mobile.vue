<template>
  <div class="mobile" @click="handleClick">
    <BaseImg class="logo" iconName="icon_23" />
    <span>{{ t("mobileTerminal.title") }}</span>
  </div>

  <el-dialog
    v-if="open"
    v-model="open"
    width="760"
    :zIndex="dialogStore.zIndex"
    append-to-body
    align-center
    :show-close="false"
  >
    <template #header="{ close }">
      <el-icon class="closeBtn" @click="close">
        <Close />
      </el-icon>
    </template>
    <div class="mobile-dialog">
      <div class="mobile-dialog_left">
        <span class="text_1">{{ t("mobileTerminal.tip_1") }}</span>
        <span class="text_2">{{ t("mobileTerminal.tip_2") }}</span>
        <div class="handleBox">
          <div class="btns">
            <el-button type="primary" @click="getApp('IOS')">
              <div class="btn">
                <BaseImg class="btn_icon" iconName="icon_ios" noTheme />
                <span class="btn_word">APP Store</span>
              </div>
            </el-button>
            <el-button type="primary" @click="getApp('Android')">
              <div class="btn">
                <BaseImg class="btn_icon" iconName="icon_andrord" noTheme />
                <span class="btn_word">Andrord</span>
              </div>
            </el-button>
          </div>
          <QRCodeVue
            :value="downloadBaseUrl"
            :size="104"
            :margin="1"
            level="H"
          />
        </div>
      </div>
      <div class="mobile-dialog_right">
        <BaseImg
          class="img"
          iconName="mobile"
          imgSuffix="png"
          catalog="images"
        />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { ref } from "vue";

import eventBus from "utils/eventBus";
import QRCodeVue from "qrcode.vue";

import { useI18n } from "vue-i18n";
import { useNetwork } from "@/store/modules/network";
const { t } = useI18n();

const dialogStore = useDialog();
const open = ref<boolean>(false);

const downloadBaseUrl =
  import.meta.env.VITE_HTTP_URL_admin + "/admin-api/my/download";
const handleClick = () => {
  eventBus.emit("closeDropdown");
  dialogStore.incrementZIndex();
  open.value = true;
};
const getApp = (platform: "IOS" | "Android") => {
  const url = `${downloadBaseUrl}?platform=${platform}`;
  useNetwork().openWebsite(url);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

:deep(.el-button--primary) {
  height: 48px;
  width: 154px;
}
.mobile {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 5px;
  align-items: center;
}
.closeBtn {
  float: right;
  cursor: pointer;
}
.mobile-dialog {
  display: flex;
  width: 608px;
  min-height: 284px;
  margin: 36px auto auto auto;
  justify-content: space-between;
  gap: 56px;
  &_left {
    width: 306px;
    display: flex;
    flex-direction: column;
    padding-bottom: 40px;
    .text_1 {
      font-weight: 500;
      font-size: 18px;
      line-height: 25px;
      @include font_color("word");
    }
    .text_2 {
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      margin-top: 16px;
      margin-bottom: 23px;
      white-space: break-spaces;
      @include font_color("word");
    }

    .handleBox {
      width: 306px;
      height: 136px;
      padding: 16px;
      display: flex;
      box-sizing: border-box;
      justify-content: space-between;
      @include background_color("background");
    }
  }
  &_right {
    flex: 1;
    display: flex;
    .img {
      flex: 1;
    }
  }
}

.btns {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  .btn {
    height: 48px;
    width: 154px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    span {
      font-weight: 400;
      font-size: 16px;
    }
  }
}
</style>

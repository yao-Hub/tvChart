<template>
  <div class="loginArticle">
    <el-text type="info">{{ t("article.loginsee") }}</el-text>
    <el-text type="primary" @click="goProtocol('service-article')">
      {{ t("leftBook") }}{{ t("article.userAgreement") }}{{ t("rightBook") }}
    </el-text>
    <el-text type="info">&nbsp;{{ t("and") }}&nbsp;</el-text>
    <el-text type="primary" @click="goProtocol('privacy-policy')">
      {{ t("leftBook") }}{{ t("article.privacyPolicy") }}{{ t("rightBook") }}
    </el-text>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useNetwork } from "@/store/modules/network";

const router = useRouter();
const { t } = useI18n();
const goProtocol = (columnCode: string) => {
  const { href } = router.resolve({
    name: "protocol",
    query: {
      columnCode,
    },
  });
  useNetwork().openWebsite(href, columnCode);
};
</script>

<style lang="scss" scoped>
.loginArticle {
  height: 56px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  padding: 6px;
}

[data-theme="light"] .loginArticle {
  background-color: #fff9eb;
}

[data-theme="dark"] .loginArticle {
  background-color: #262b35;
}
</style>

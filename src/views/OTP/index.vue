<template>
  <el-dialog
    v-if="dialogStore.visibles.OTPVisible"
    v-model="dialogStore.visibles.OTPVisible"
    width="548"
    :zIndex="dialogStore.zIndex"
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="title">
        {{ status ? t("otp.unbindOTP") : t("otp.bindOTP") }}
      </div>
    </template>
    <!-- 解绑 -->
    <Unbind v-if="status"></Unbind>
    <!-- 绑定 -->
    <binding v-if="!status"></binding>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useUser } from "@/store/modules/user";
import { useDialog } from "@/store/modules/dialog";

import Binding from "./binding.vue";
import Unbind from "./unbind.vue";

const dialogStore = useDialog();
const { t } = useI18n();

const status = computed(() => useUser().state.loginInfo?.otp_status);

const handleClose = () => {
  dialogStore.closeDialog("OTPVisible");
};
</script>

<style lang="scss" scoped>
.title {
  font-weight: 500;
  font-size: 18px;
}
</style>

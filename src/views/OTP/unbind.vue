<template>
  <div class="unbind">
    <el-text type="info">{{ t("otp.unbindTip") }}</el-text>
    <el-form
      ref="pwdFormRef"
      :model="formState"
      :rules="formrules"
      label-position="top"
      class="form"
    >
      <el-form-item :label="t('account.password')" prop="pass">
        <el-input
          v-model="formState.pass"
          type="password"
          :placeholder="t('tip.passwordRequired')"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item :label="t('otp.name')" prop="otp_code">
        <el-input
          v-model="formState.otp_code"
          :placeholder="t('tip.enterVeriCode')"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          class="btn"
          :loading="loading"
          @click="unbind"
          >{{ t("ok") }}</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ElNotification, FormRules } from "element-plus";
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { unbindOTP } from "@/api/account";
import { useSystem } from "@/store/modules/system";
import { useDialog } from "@/store/modules/dialog";
import { useUser } from "@/store/modules/user";

const { t } = useI18n();
interface PwdFormState {
  pass: string;
  otp_code: string;
}

const formState = reactive<PwdFormState>({
  pass: "",
  otp_code: "",
});
const formrules = reactive<FormRules<typeof formState>>({
  pass: [
    { required: true, trigger: "blur", message: t("tip.passwordRequired") },
  ],
  otp_code: [
    { required: true, trigger: "blur", message: t("tip.enterVeriCode") },
  ],
});

const loading = ref(false);
const unbind = () => {
  loading.value = true;
  unbindOTP({
    password: formState.pass,
    otp_code: formState.otp_code,
    device_id: useSystem().systemInfo!.deviceId,
  }).then(
    () => {
      useUser().executeLogic(); // 个人信息
      loading.value = false;
      ElNotification.success({
        title: t("tip.succeed", { type: t("otp.unbindOTP") }),
      });
      useDialog().closeDialog("OTPVisible");
    },
    () => {
      loading.value = false;
    }
  );
};
</script>

<style lang="scss" scoped>
:deep(.el-input__wrapper) {
  height: var(--base-height);
}
:deep(.el-button) {
  height: var(--base-height);
}

.unbind {
  padding-top: 7px;
  display: flex;
  flex-direction: column;
  gap: 0px;
  span:first-child {
    align-self: flex-start;
  }
}
.form {
  margin-top: 24px;
}
.btn {
  width: 100%;
}
</style>

<template>
  <el-dialog
    v-model="modalOpen"
    width="486"
    :zIndex="10"
    destroy-on-close
    append-to-body
  >
    <template #header>
      <span class="header">{{ $t("account.resetPassword") }}</span>
    </template>
    <div class="Reset">
      <div class="Reset_title">
        <BaseImg iconName="logo@3x" imgSuffix="png" />
        <div class="Reset_title_right">
          <span class="up">{{ networkStore.currentLine?.lineName }}</span>
          <span class="down">{{ networkStore.currentLine?.brokerName }}</span>
        </div>
      </div>

      <el-form
        label-width="auto"
        :model="formState"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item
          :label="$t('user.nowPassword')"
          label-position="top"
          prop="oldpass"
        >
          <el-input
            v-model="formState.oldpass"
            autocomplete="off"
            :placeholder="t('tip.enterOldPwd')"
          />
        </el-form-item>
        <el-form-item prop="pass" label-position="top">
          <template #label>
            {{ $t("user.newPassword") }} ({{ $t("tip.passwordFormatRule") }})
          </template>
          <el-input
            v-model="formState.pass"
            type="password"
            autocomplete="off"
            :placeholder="t('tip.enterNewPwd')"
          />
        </el-form-item>

        <el-form-item prop="checkPass">
          <el-input
            v-model="formState.checkPass"
            type="password"
            autocomplete="off"
            :placeholder="t('tip.confirmPwd')"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            style="width: 72px; height: 40px"
            @click="submit(formRef)"
            >{{ $t("tip.confirmChange") }}</el-button
          >
        </el-form-item>
      </el-form>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useNetwork } from "@/store/modules/network";
import { passwordReset } from "api/account/index";
import type { FormInstance, FormRules } from "element-plus";
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const networkStore = useNetwork();
const { t } = useI18n();

const modalOpen = defineModel("open", { type: Boolean, default: false });

interface FormState {
  pass: string;
  checkPass: string;
  oldpass: string;
}

const formState = reactive<FormState>({
  pass: "",
  checkPass: "",
  oldpass: "",
});
const formRef = ref<FormInstance>();
watch(
  () => modalOpen.value,
  () => {
    formRef.value && formRef.value.resetFields();
  }
);
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input the password"));
  } else {
    // 匹配6-24位数字和字母组合，不能包含空格
    const regex = /^[a-zA-Z0-9]{6,24}$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error(t("tip.passwordFormatRule")));
      return;
    }
    if (formState.checkPass !== "") {
      formRef.value?.validateField("checkPass");
    }
    callback();
  }
};
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error(t("tip.reInputPassword")));
  } else if (value !== formState.pass) {
    callback(new Error(t("tip.noSamePassword")));
  } else {
    callback();
  }
};
const rules = reactive<FormRules<typeof formState>>({
  oldpass: [{ required: true, trigger: "change" }],
  pass: [{ required: true, validator: validatePass, trigger: "change" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "change" }],
});

import { ElMessage } from "element-plus";
const submit = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      const { pass, oldpass } = formState;
      await passwordReset({
        old_password: oldpass,
        new_password: pass,
      });
      ElMessage({
        message: t("tip.succeed", { type: t("account.resetPassword") }),
        type: "success",
      });
      modalOpen.value = false;
    }
  });
};

import { onMounted } from "vue";
onMounted(() => {
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      submit(formRef.value);
    }
  });
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}

.Reset {
  padding: 32px 56px;
  width: 100%;
  box-sizing: border-box;
  &_title {
    display: flex;
    height: 68px;
    margin-bottom: 24px;
    img {
      width: 64px;
      height: 64px;
      margin-right: 16px;
      border-radius: 50%;
    }
    &_right {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      .up {
        font-size: 16px;
      }
      .down {
        @include font_color("word-gray");
      }
    }
  }
}
</style>

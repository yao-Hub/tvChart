<template>
  <div class="resetPassword">
    <span class="resetPassword_title">{{ $t(`account.resetPassword`) }}</span>
    <a-form
      ref="formRef"
      name="form"
      layout="vertical"
      :model="formState"
      :labelCol="{ span: 10 }"
      :rules="rules"
      @finish="onFinish"
    >
      <a-form-item has-feedback :label="$t('user.oldPassword')" name="oldpass">
        <a-input
          v-model:value="formState.oldpass"
          type="password"
          autocomplete="off"
          placeholder="enter old password"
        />
      </a-form-item>

      <a-form-item has-feedback :label="$t('user.newPassword')" name="pass">
        <a-input
          v-model:value="formState.pass"
          type="password"
          autocomplete="off"
          placeholder="enter new password"
        />
      </a-form-item>

      <a-form-item
        has-feedback
        :label="$t('user.confirmPassword')"
        name="checkPass"
      >
        <a-input
          v-model:value="formState.checkPass"
          type="password"
          autocomplete="off"
          placeholder="confirm new password"
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">{{
          $t("account.resetPassword")
        }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { Rule } from "ant-design-vue/es/form";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import { passwordReset } from "api/account/index";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();
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
const validatePass = async (_rule: Rule, value: string) => {
  if (value === "") {
    return Promise.reject("Please input the password");
  } else {
    // 匹配6-24位数字和字母组合，不能包含空格
    const regex = /^[a-zA-Z0-9]{6,24}$/;
    if (regex.test(value)) {
      Promise.resolve();
    } else {
      return Promise.reject("must be 6-24 digits and letters, without spaces");
    }
    if (formState.checkPass !== "") {
      formRef.value?.validateFields("checkPass");
    }
    return Promise.resolve();
  }
};
const validatePass2 = async (_rule: Rule, value: string) => {
  if (value === "") {
    return Promise.reject("Please input the password again");
  } else if (value !== formState.pass) {
    return Promise.reject("Two inputs don't match!");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  oldpass: [{ required: true, trigger: "change" }],
  pass: [{ required: true, validator: validatePass, trigger: "change" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "change" }],
};

const onFinish = async (values: any) => {
  const { pass, oldpass } = values;
  const res = await passwordReset({
    admin_password: oldpass,
    new_password: pass,
  });
  console.log(res);
  message.success(t("tip.succeed", { type: t("account.resetPassword") }));
  router.push({ name: "login" });
};
</script>

<style lang="scss" scoped>
.resetPassword {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  padding-top: 100px;
  box-sizing: border-box;
  overflow: hidden;
  &_title {
    font-size: 24px;
  }
}
</style>

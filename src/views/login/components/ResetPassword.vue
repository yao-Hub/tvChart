<template>
  <a-modal v-model:open="modalOpen" title="更改密码" :footer="null">
    <div class="container">
      <div class="container_title">
        <img src="@/assets/icons/logo@3x.png" />
        <div class="container_title_right">
          <span class="up">{{ networkStore.currentLine?.lineName }}</span>
          <span class="down">{{ networkStore.currentLine?.brokerName }}</span>
        </div>
      </div>
      <a-form
        ref="formRef"
        name="form"
        layout="vertical"
        :model="formState"
        :labelCol="{ span: 10 }"
        :rules="rules"
        @finish="onFinish"
      >
        <a-form-item
          has-feedback
          name="oldpass"
          :label="$t('user.nowPassword')"
        >
          <a-input
            v-model:value="formState.oldpass"
            type="password"
            autocomplete="off"
            placeholder="enter old password"
          />
        </a-form-item>

        <a-form-item has-feedback name="pass" :labelCol="{ span: 24 }">
          <template #label>
            {{ $t("user.newPassword") }} ({{ $t("tip.resetPassword") }})
          </template>
          <a-input
            v-model:value="formState.pass"
            type="password"
            autocomplete="off"
            placeholder="enter new password"
          />
        </a-form-item>

        <a-form-item has-feedback name="checkPass">
          <a-input
            v-model:value="formState.checkPass"
            type="password"
            autocomplete="off"
            placeholder="confirm new password"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            style="width: 72px; height: 40px"
            >确认更改</a-button
          >
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, watch } from "vue";
import type { Rule } from "ant-design-vue/es/form";
import type { FormInstance } from "ant-design-vue";
import { message } from "ant-design-vue";
import { passwordReset } from "api/account/index";
import { useI18n } from "vue-i18n";
import { useNetwork } from "@/store/modules/network";

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
  async (val) => {
    if (val && formRef.value) {
      await nextTick();
      formRef.value.resetFields();
    }
  },
);
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
  await passwordReset({
    admin_password: oldpass,
    new_password: pass,
  });
  message.success(t("tip.succeed", { type: t("account.resetPassword") }));
  modalOpen.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.container {
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
    }
    &_right {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      .up {
        font-size: 16px;
      }
      .down {
        font-size: 12px;
        @include font_color("word-gray");
      }
    }
  }
}
</style>

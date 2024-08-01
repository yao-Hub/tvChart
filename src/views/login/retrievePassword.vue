<template>
  <div class="retrievePassword">
    <span class="retrievePassword_title">{{
      $t(`account.retrievePassword`)
    }}</span>
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
        name="email"
        :label="$t('user.email')"
        :rules="[{ required: true, message: 'Please input your email!' }]"
      >
        <a-auto-complete
          v-model:value="formState.email"
          placeholder="input email"
          :options="options"
          @search="handleSearch"
        >
          <template #option="{ value: val }">
            {{ val.split("@")[0] }} @
            <span style="font-weight: bold">{{ val.split("@")[1] }}</span>
          </template>
        </a-auto-complete>
      </a-form-item>

      <a-form-item
        name="code"
        :label="$t('account.verificationCode')"
        :rules="[{ required: true, message: 'Please input your code!' }]"
      >
        <a-input v-model:value="formState.code" placeholder="code">
          <template #suffix>
            <a-button type="link">{{ $t("account.sendCode") }}</a-button>
          </template>
        </a-input>
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
          $t("account.retrievePassword")
        }}</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { Rule } from "ant-design-vue/es/form";
import type { FormInstance } from "ant-design-vue";
import { useRouter } from "vue-router";
const router = useRouter();

const options = ref<{ value: string }[]>([]);

const handleSearch = (val: string) => {
  let res: { value: string }[];
  if (!val || val.indexOf("@") >= 0) {
    res = [];
  } else {
    res = ["gmail.com", "163.com", "qq.com", "126.com", "souhu.com"].map(
      (domain) => ({ value: `${val}@${domain}` })
    );
  }
  options.value = res;
};

interface FormState {
  email: string;
  code: string;
  pass: string;
  checkPass: string;
}

const formState = reactive<FormState>({
  code: "",
  email: "",
  pass: "",
  checkPass: "",
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
  pass: [{ required: true, validator: validatePass, trigger: "change" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "change" }],
};

const onFinish = (values: any) => {
  console.log("Success:", values);
  router.push({ name: "login" });
};
</script>

<style lang="scss" scoped>
.retrievePassword {
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

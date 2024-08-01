<template>
  <div class="register">
    <span class="register_title">{{ $t("account.registerAccount") }}</span>
    <a-form
      name="basic"
      layout="vertical"
      :model="formState"
      :labelCol="{ span: 6 }"
      @finish="onFinish"
    >
      <a-form-item
        :label="$t('user.email')"
        name="email"
        :rules="[{ required: true, message: 'Please input your email!' }]"
      >
        <a-auto-complete
          v-model:value="formState.email"
          placeholder="email"
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
        :label="$t('account.verificationCode')"
        name="code"
        :rules="[{ required: true, message: 'Please input your code!' }]"
      >
        <a-input v-model:value="formState.code" placeholder="Basic usage">
          <template #suffix>
            <a-button type="link">{{ $t("account.sendCode") }}</a-button>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item name="agree">
        <a-checkbox v-model:checked="formState.agree">{{
          $t("tip.agree")
        }}</a-checkbox>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">{{
          $t("account.register")
        }}</a-button>
      </a-form-item>
    </a-form>
  </div>
  <a-modal v-model:open="open" :footer="null">
    <div class="successModal">
      <span>创建模拟账号成功</span>
      <div class="successModal_account">
        <span>账号： {{ account.name }}</span>
        <span>密码： {{ account.pass }}</span>
        <a-button type="link" @click="copy">复制</a-button>
      </div>
      <a-button type="primary" @click="$router.push({ name: 'login' })"
        >开始使用模拟账号</a-button
      >
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "ant-design-vue";
const options = ref<{ value: string }[]>([]);

const open = ref<boolean>(false);

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
  agree: boolean;
}

const formState = reactive<FormState>({
  code: "",
  email: "",
  agree: true,
});

const account = reactive({
  name: "12400001",
  pass: "abc111",
});

const onFinish = (values: any) => {
  console.log("Success:", values);
  const { agree } = values;

  if (!agree) {
    message.warning("请同意条款");
    return;
  }
  open.value = true;
};

import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();

const copy = async () => {
  try {
    await toClipboard(`账号：${account.name};密码：${account.pass}`);
    message.success("复制成功");
  } catch (e) {
    console.log(e);
    message.error("复制失败");
  }
};
</script>

<style lang="scss" scoped>
.register {
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

.successModal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  &_account {
    display: flex;
    width: 300px;
    justify-content: space-between;
    align-items: center;
  }
}
</style>

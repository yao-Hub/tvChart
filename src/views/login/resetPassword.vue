<template>
  <div class="resetPassword">
    <span class="resetPassword_title">重置密码</span>
    <a-form
      ref="formRef"
      :model="formState"
      name="form"
      :labelCol="{span: 5}"
      :rules="rules"
      @finish="onFinish">
      <a-form-item label="邮箱" name="email" :rules="[{ required: true, message: 'Please input your email!' }]">
        <a-auto-complete
          v-model:value="formState.email"
          placeholder="input here"
          :options="options" @search="handleSearch">
          <template #option="{ value: val }">
            {{ val.split('@')[0] }} @
            <span style="font-weight: bold">{{ val.split('@')[1] }}</span>
          </template>
        </a-auto-complete>
      </a-form-item>
  
      <a-form-item label="验证码" name="code" :rules="[{ required: true, message: 'Please input your code!' }]">
        <a-input v-model:value="formState.code" placeholder="Basic usage">
          <template #suffix>
            <a-button type="link">获取验证码</a-button>
          </template>
        </a-input>
      </a-form-item>

      <a-form-item has-feedback label="密码" name="pass">
        <a-input v-model:value="formState.pass" type="password" autocomplete="off" placeholder="输入新密码"/>
      </a-form-item>

      <a-form-item has-feedback label="确认密码" name="checkPass">
        <a-input v-model:value="formState.checkPass" type="password" autocomplete="off" placeholder="确认新密码"/>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%;">重置密码</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { Rule } from 'ant-design-vue/es/form';
import type { FormInstance } from 'ant-design-vue';

const options = ref<{ value: string; }[]>([]);

const handleSearch = (val: string) => {
  let res: { value: string; }[];
  if (!val || val.indexOf('@') >= 0) {
    res = [];
  } else {
    res = ['gmail.com', '163.com', 'qq.com'].map(domain => ({ value: `${val}@${domain}` }));
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
  code: '',
  email: '',
  pass: '',
  checkPass: '',
});
const formRef = ref<FormInstance>();
const validatePass = async (_rule: Rule, value: string) => {
  if (value === '') {
    return Promise.reject('Please input the password');
  } else {
    if (formState.checkPass !== '') {
      formRef.value?.validateFields('checkPass');
    }
    return Promise.resolve();
  }
};
const validatePass2 = async (_rule: Rule, value: string) => {
  if (value === '') {
    return Promise.reject('Please input the password again');
  } else if (value !== formState.pass) {
    return Promise.reject("Two inputs don't match!");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  pass: [{ required: true, validator: validatePass, trigger: 'change' }],
  checkPass: [{ required: true, validator: validatePass2, trigger: 'change' }],
};

const onFinish = (values: any) => {
  console.log('Success:', values);
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
  margin-top: 100px;
  &_title {
    font-size: 24px;
  }
}
</style>
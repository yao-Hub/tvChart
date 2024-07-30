<template>
  <div class="register">
    <span class="register_title">注册</span>
    <a-form
      :model="formState"
      name="basic"
      :labelCol="{span: 5}"
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
  
      <a-form-item name="agree">
        <a-checkbox v-model:checked="formState.agree">我同意开设账户和数据保护政策的条款和条件</a-checkbox>
      </a-form-item>
  
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%;" >注册</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { message } from 'ant-design-vue';

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
  agree: boolean;
}

const formState = reactive<FormState>({
  code: '',
  email: '',
  agree: true,
});
const onFinish = (values: any) => {
  console.log('Success:', values);
  const { agree } = values;

  if (!agree) {
    message.warning('请同意条款');
    return;
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
  margin-top: 100px;
  &_title {
    font-size: 24px;
  }
}
</style>
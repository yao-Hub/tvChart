<template>
  <div class="forget">
    <div class="forget_header">
      <div class="forget_header_goback" @click="emit('goBack')">
        <el-icon>
          <img src="@/assets/icons/turnleft.svg" />
        </el-icon>
        <span>返回</span>
      </div>
    </div>
    <div class="forget_main">
      <div class="forget_main_title">
        <img src="@/assets/icons/logo@3x.png" />
        <div class="forget_main_title_right">
          <span class="up">{{ props.lineInfo.lineName }}</span>
          <span class="down">{{ props.lineInfo.brokerName }}</span>
        </div>
      </div>
      <el-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        label-position="top"
      >
        <el-form-item prop="email" :label="$t('user.email')">
          <el-autocomplete
            v-model="formState.email"
            :fetch-suggestions="querySearch"
            :trigger-on-focus="false"
            clearable
            placeholder="input email"
          />
        </el-form-item>

        <el-form-item prop="code" :label="$t('account.verificationCode')">
          <el-input v-model="formState.code" placeholder="code">
            <template #suffix>
              <span class="link">{{ $t("account.sendCode") }}</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="$t('user.newPassword')" prop="pass">
          <el-input
            v-model="formState.pass"
            type="password"
            placeholder="enter new password"
          />
        </el-form-item>

        <el-form-item prop="checkPass">
          <el-input
            v-model="formState.checkPass"
            type="password"
            placeholder="confirm new password"
          />
        </el-form-item>

        <el-button
          type="primary"
          class="submit-button"
          :disabled="!isFormValid"
          @click="resetPwd"
          >{{ $t("account.resetPassword") }}</el-button
        >
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { emailPasswordUpdate, resQueryTradeLine } from "api/account/index";
import { ElMessage } from "element-plus";

interface Props {
  lineInfo: resQueryTradeLine;
}
const props = defineProps<Props>();

const emit = defineEmits(["goBack"]);

const querySearch = (queryString: string, cb: any) => {
  let res: { value: string }[];
  if (!queryString || queryString.indexOf("@") >= 0) {
    res = [];
  } else {
    res = ["gmail.com", "163.com", "qq.com", "126.com", "souhu.com"].map(
      (domain) => ({ value: `${queryString}@${domain}` })
    );
  }
  cb(res);
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
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input the password"));
  } else {
    // 匹配6-24位数字和字母组合，不能包含空格
    const regex = /^[a-zA-Z0-9]{6,24}$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error("must be 6-24 digits and letters"));
    }
    if (formState.checkPass !== "") {
      formRef.value?.validateField("checkPass");
    }
    callback();
  }
};
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error("Please input the password again"));
  } else if (value !== formState.pass) {
    callback(new Error("Two inputs don't match!"));
  } else {
    callback();
  }
};

const rules = reactive<FormRules<typeof formState>>({
  email: [
    { required: true, message: "Please input your email!", trigger: "blur" },
  ],
  code: [
    { required: true, message: "Please input your code!", trigger: "blur" },
  ],
  pass: [{ required: true, validator: validatePass, trigger: "blur" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "blur" }],
});

const isFormValid = ref(false);

const validateForm = () => {
  formRef.value?.validate((valid: any) => {
    isFormValid.value = valid;
  });
};

watch(() => formState, validateForm, { deep: true });

const resetPwd = async (values: any) => {
  const { code, email, pass, checkPass } = values;
  await emailPasswordUpdate({
    server: props.lineInfo.lineName,
    email,
    verify_code: code,
    new_password: pass,
    confirm_password: checkPass,
  });
  ElMessage.success("reset success");
  emit("goBack");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.forget {
  width: 512px;
  height: 648px;
  border-radius: 16px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  &_header {
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    margin-left: 32px;
    &_goback {
      cursor: pointer;
      display: flex;
      gap: 4px;
    }
  }
  &_main {
    padding: 24px 32px;
    &_title {
      display: flex;
      height: 68px;
      margin-bottom: 37px;
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
  .submit-button {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    font-weight: 400;
    font-size: 16px;
  }
}

.link {
  @include font_color("word-gray");
  font-size: var(--font-size);
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>

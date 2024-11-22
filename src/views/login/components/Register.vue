<template>
  <div class="Register">
    <div class="Register_header">
      <div class="Register_header_goback" @click="back">
        <el-icon>
          <img src="@/assets/icons/turnleft.svg" />
        </el-icon>
        <span>返回</span>
      </div>
    </div>
    <div class="Register_main" v-if="!ifSuccess">
      <div class="Register_main_title">
        <img src="@/assets/icons/logo@3x.png" />
        <div class="Register_main_title_right">
          <span class="up">{{ props.lineInfo.lineName }}</span>
          <span class="down">{{ props.lineInfo.brokerName }}</span>
        </div>
      </div>
      <el-form
        :model="formState"
        label-position="top"
        :rules="rules"
        ref="formRef"
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

        <el-form-item :label="$t('account.verificationCode')" prop="code">
          <el-input v-model="formState.code" placeholder="Basic usage">
            <template #suffix>
              <span class="link">{{ $t("account.sendCode") }}</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="agree">
          <el-checkbox v-model="formState.agree">{{
            $t("tip.agree")
          }}</el-checkbox>
        </el-form-item>

        <el-button
          type="primary"
          class="submit-button"
          :disabled="!btnDisabled"
          @click="submit(formRef)"
          >{{ $t("account.register") }}</el-button
        >
      </el-form>
    </div>

    <div class="success-card" v-else>
      <img class="typeIcon" src="@/assets/icons/icon_success.svg" />
      <span class="tipSuc">{{ $t("account.registerSucceed") }}</span>
      <span class="tipSav">{{ $t("tip.keepPasswordSave") }}</span>
      <div class="copyBox">
        <div class="item">
          <span class="label">{{ $t("account.accountNumber") }}： </span>
          <span class="value">{{ account.name }}</span>
        </div>
        <div class="item">
          <span class="label">{{ $t("account.password") }}：</span>
          <span class="value"> {{ account.pass }}</span>
        </div>
        <span class="copyBtn" @click="copy">{{ $t("account.copy") }}</span>
      </div>
      <el-button class="startUseBtn" type="primary" @click="emit('goBack')">{{
        $t("account.startUse")
      }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { register, resQueryTradeLine } from "api/account/index";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

interface Props {
  lineInfo: resQueryTradeLine;
}
const props = defineProps<Props>();

const emit = defineEmits(["goBack"]);

interface FormState {
  email: string;
  code: string;
  agree: boolean;
}
const formState = reactive<FormState>({
  code: "",
  email: "",
  agree: false,
});
const formRef = ref<FormInstance>();
const rules = reactive<FormRules<typeof formState>>({
  email: [
    {
      required: true,
      trigger: "blur",
      message: "Please input your email!",
    },
  ],
  code: [
    {
      required: true,
      message: "Please input your code!",
      trigger: "blur",
    },
  ],
});

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
const btnDisabled = computed(() => {
  return Object.values(formState).every((value) => Boolean(value));
});
const ifSuccess = ref<boolean>(false);
const account = reactive({
  name: "",
  pass: "",
});
const submit = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      const { code, email } = formState;
      const res = await register({
        server: props.lineInfo.lineName,
        email,
        verify_code: code,
      });
      account.name = res.data.login;
      account.pass = res.data.password;
      ifSuccess.value = true;
    }
  });
};

const back = () => {
  if (ifSuccess.value) {
    ifSuccess.value = !ifSuccess.value;
    return;
  }
  emit("goBack");
};

import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
const copy = async () => {
  try {
    await toClipboard(`账号：${account.name};密码：${account.pass}`);
    ElMessage.success("复制成功");
  } catch (e) {
    ElMessage.error("复制失败");
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.Register {
  position: relative;
  width: 512px;
  height: 648px;
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
  &_header {
    width: 100%;
    height: 56px;
    display: flex;
    align-items: center;
    padding-left: 32px;
    box-sizing: border-box;
    &_goback {
      cursor: pointer;
      display: flex;
      gap: 4px;
    }
  }
  &_main {
    padding: 40px 32px;
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
  .submit-button {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    font-weight: 400;
    margin-top: 40px;
    font-size: 16px;
  }
  .success-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 48px 32px;
    box-sizing: border-box;
    .typeIcon {
      width: 64px;
      height: 64px;
    }
    .tipSuc {
      font-weight: 500;
      font-size: 18px;
      margin-top: 16px;
    }
    .tipSav {
      font-weight: 400;
      margin-top: 8px;
      @include font_color("word-gray");
      font-size: 14px;
    }
    .copyBox {
      height: 56px;
      width: 100%;
      border-radius: 4px;
      border: 1px solid;
      @include border_color("border");
      display: flex;
      align-items: center;
      margin-top: 24px;
      gap: 24px;
      justify-content: space-around;
      .item {
        font-weight: 400;
        font-size: 16px;
      }
      .label {
        @include font_color("word-gray");
      }
      .copyBtn {
        @include font_color("primary");
        cursor: pointer;
      }
    }
  }
}

.startUseBtn {
  height: 56px;
  width: 100%;
  font-weight: 400;
  font-size: 16px;
  margin-top: 24px;
}

.link {
  @include font_color("word-gray");
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>

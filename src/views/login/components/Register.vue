<template>
  <div class="Register scrollList">
    <div class="goback">
      <div @click="back">
        <el-icon>
          <BaseImg iconName="turnleft" />
        </el-icon>
        <span>{{ t("back") }}</span>
      </div>
    </div>
    <div class="Register_main" v-if="!ifSuccess">
      <div class="Register_main_title">
        <img class="img" :src="lineInfo.lineLogo" />
        <div class="Register_main_title_right">
          <span class="up">{{ lineInfo.lineName }}</span>
          <span class="down">{{ lineInfo.brokerName }}</span>
        </div>
      </div>
      <el-form
        :model="formState"
        label-position="top"
        :rules="rules"
        ref="formRef"
      >
        <el-form-item prop="email" :label="t('account.email')">
          <el-autocomplete
            v-model="formState.email"
            :fetch-suggestions="querySearch"
            :trigger-on-focus="false"
            clearable
            :placeholder="t('tip.emailRequired')"
          />
        </el-form-item>

        <el-form-item :label="t('account.verificationCode')" prop="code">
          <VerificationCode
            type="register"
            v-model:value="formState.code"
            :email="formState.email"
          ></VerificationCode>
        </el-form-item>

        <el-checkbox v-model="formState.agree">
          <span>{{ t("article.readAgree") }}&nbsp;</span>
          <el-link
            type="primary"
            target="_blank"
            :underline="false"
            @click.prevent="goProtocol('service-article')"
            >{{ t("article.userAgreement") }}</el-link
          >
          <span class="word">&nbsp;{{ t("and") }}&nbsp;</span>
          <el-link
            type="primary"
            target="_blank"
            :underline="false"
            @click.prevent="goProtocol('privacy-policy')"
            >{{ t("article.privacyPolicy") }}</el-link
          >
        </el-checkbox>

        <el-button
          type="primary"
          class="submit-button"
          :disabled="!btnDisabled"
          @click="submit(formRef)"
          >{{ t("account.createAccount") }}</el-button
        >
      </el-form>
    </div>

    <div class="success-card" v-else>
      <BaseImg class="typeIcon" iconName="icon_success" />
      <span class="tipSuc">{{ t("account.registerSucceed") }}</span>
      <span class="tipSav">{{ t("tip.keepPasswordSave") }}</span>
      <div class="copyBox">
        <div class="item">
          <el-text type="info">{{ t("account.accountNum") }}： </el-text>
          <el-text>{{ account.name }}</el-text>
        </div>
        <div class="item">
          <el-text type="info">{{ t("account.password") }}：</el-text>
          <el-text> {{ account.pass }}</el-text>
        </div>
        <span class="copyBtn" @click="copy">{{ t("account.copy") }}</span>
      </div>
      <el-button class="startUseBtn" type="primary" @click="start">{{
        t("account.startUse")
      }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import VerificationCode from "./VerificationCode.vue";

import { protocolAgree, register } from "api/account/index";

import { useNetwork } from "@/store/modules/network";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const networkStore = useNetwork();

const lineInfo = computed(() => {
  const server = route.params.server;
  const target = networkStore.queryTradeLines.find(
    (e) => e.lineName === server
  );
  if (target) {
    return target;
  }
  return {
    lineName: "",
    brokerName: "",
    lineLogo: "",
  };
});

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
      message: t("tip.emailRequired"),
    },
  ],
  code: [
    {
      required: true,
      message: t("tip.codeRequired"),
      trigger: "blur",
    },
  ],
});

const goProtocol = (columnCode: string) => {
  const { href } = router.resolve({
    name: "protocol",
    query: {
      columnCode,
    },
  });
  window.open(href, "_blank");
};

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
  if (!btnDisabled.value) {
    return;
  }

  formEl.validate(async (valid) => {
    if (valid) {
      const { code, email } = formState;
      const target = networkStore.queryTradeLines.find(
        (e) => e.lineName === lineInfo.value.lineName
      );
      if (target) {
        await protocolAgree({
          columnCodes: ["privacy-policy", "service-article"],
          brokerName: lineInfo.value.brokerName,
          lineName: lineInfo.value.lineName,
          login: email,
        });
      }
      const res = await register({
        server: lineInfo.value.lineName,
        email,
        verify_code: code,
      });
      account.name = res.data.login;
      account.pass = res.data.password;
      ifSuccess.value = true;
    }
  });
};

const start = () => {
  ifSuccess.value = false;
  back();
};

import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
const copy = async () => {
  try {
    await toClipboard(
      `${t("account.accountnum")}：${account.name};${t("account.password")}：${
        account.pass
      }`
    );
    ElMessage.success(t("tip.copySucceed"));
  } catch (e) {
    ElMessage.error(t("tip.copyFail"));
  }
};

const back = () => {
  router.back();
};

import { onMounted, onUnmounted } from "vue";
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    submit(formRef.value);
  }
}
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.Register {
  padding: 0 32px 0 32px;
  position: relative;
  box-sizing: border-box;
  overflow: auto;
  height: 100%;
  &_main {
    width: 100%;
    box-sizing: border-box;
    &_title {
      display: flex;
      height: 68px;
      margin-bottom: 24px;
      .img {
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
    margin: 40px 0;
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

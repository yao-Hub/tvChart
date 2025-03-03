<template>
  <div class="Login scrollList">
    <div class="goback" v-if="ifloginBack">
      <div @click="goAccount">
        <el-icon>
          <BaseImg iconName="turnleft" />
        </el-icon>
        <span>{{ t("back") }}</span>
      </div>
    </div>
    <span class="plogin" :style="{ marginTop: ifloginBack ? '' : '24px' }">{{
      t("logAccount")
    }}</span>
    <span class="padd">{{ t("noAccount") }}</span>
    <el-form
      ref="ruleFormRef"
      :model="formState"
      label-position="top"
      class="login-form"
      :rules="rules"
    >
      <el-form-item prop="server" :label="t('order.tradingRoute')">
        <el-select
          v-model="formState.server"
          filterable
          default-first-option
          :suffix-icon="Search"
          autocomplete="new-password"
        >
          <el-option
            v-for="item in networkStore.queryTradeLines"
            :key="item.lineName"
            :label="item.lineName"
            :value="item.lineName"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('account.accountNum')" prop="login">
        <el-input
          v-model="formState.login"
          :placeholder="t('tip.usernameRequired')"
        />
      </el-form-item>

      <el-form-item :label="t('account.password')" prop="password">
        <el-input
          v-model="formState.password"
          type="password"
          :placeholder="t('tip.passwordRequired')"
          show-password
          ref="pwd"
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item>
        <div class="login-form-remember">
          <!-- <el-checkbox
            class="link"
            v-model="formState.remember"
            :label="t('account.rememberMe')"
          /> -->
          <span
            class="link"
            style="margin-left: auto"
            v-if="ifSimulatedServer"
            @click="goForgetPassword"
            >{{ t("account.forgetPassword") }}</span
          >
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          class="login-form-button"
          type="primary"
          :disabled="disabled"
          @click="happyStart('loginBtn')"
          :loading="loading"
          >{{ t("account.login") }}</el-button
        >
      </el-form-item>

      <el-form-item style="margin-bottom: 0">
        <div class="login-form-account">
          <span> {{ t("account.noAccount") }}&nbsp;</span>
          <el-text type="primary" style="cursor: pointer" @click="goRegister">{{
            t("account.createAccount")
          }}</el-text>
        </div>
      </el-form-item>
    </el-form>
  </div>
  <div class="article">
    <span class="word">{{ t("article.loginsee") }}</span>
    <el-link
      type="primary"
      target="_blank"
      :underline="false"
      @click="goProtocol('service-article')"
      >{{ t("leftBook") }}{{ t("article.userAgreement")
      }}{{ t("rightBook") }}</el-link
    >
    <span class="word"> {{ t("and") }} </span>
    <el-link
      type="primary"
      target="_blank"
      :underline="false"
      @click="goProtocol('privacy-policy')"
      >{{ t("leftBook") }}{{ t("article.privacyPolicy")
      }}{{ t("rightBook") }}</el-link
    >
    <span></span>
  </div>
</template>

<script setup lang="ts">
import { PageEnum } from "@/constants/pageEnum";
import { Search } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { useSocket } from "@/store/modules/socket";

import { sendTrack } from "@/utils/track";

const { t } = useI18n();

const router = useRouter();
const route = useRoute();

const networkStore = useNetwork();
const userStore = useUser();

const query = route.query;

interface FormState {
  login: string;
  password: string;
  remember: boolean;
  server: string;
}
const formState = reactive<FormState>({
  server: "",
  login: "",
  password: "",
  remember: false,
});
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const rules = reactive<FormRules<typeof formState>>({
  server: [
    {
      required: true,
      trigger: "change",
      message: t("tip.serverRequired"),
    },
  ],
  login: [
    {
      required: true,
      trigger: "change",
      message: t("tip.loginRequired"),
    },
  ],
  password: [
    {
      required: true,
      message: t("tip.passwordRequired"),
      trigger: "change",
    },
  ],
});

const disabled = computed(() => {
  return !(formState.login && formState.password);
});

const ifloginBack = computed(() => {
  return userStore.state.accountList.length;
});

// 是否是官方模拟服务器
const ifSimulatedServer = computed(() => {
  if (formState.server) {
    const target = networkStore.queryTradeLines.find(
      (e) => e.lineName === formState.server
    );
    if (target) {
      return target.isOfficial === "1";
    }
    return false;
  }
  return false;
});

import { protocolAgree } from "api/account/index";

const goProtocol = (columnCode: string) => {
  const { href } = router.resolve({
    name: "protocol",
    query: {
      columnCode,
    },
  });
  window.open(href, "_blank");
};

const happyStart = async (actionObject: string) => {
  try {
    if (disabled.value) {
      return;
    }
    const target = networkStore.queryTradeLines.find(
      (e) => e.lineName === formState.server
    );
    if (target) {
      await protocolAgree({
        columnCodes: ["privacy-policy", "service-article"],
        brokerName: target.brokerName,
        lineName: target.lineName,
        login: formState.login,
      }).catch((e) => {
        loading.value = false;
      });
    }
    userStore.login(formState, ({ ending, success }) => {
      loading.value = !ending;
      if (ending && success) {
        sendTrack({
          actionType: "signUp",
          actionObject,
        });
        useSocket().emitOnline();
        router.push({ path: "/" });
      }
    });
  } catch (e) {
    loading.value = false;
  }
};

const goAccount = () => {
  router.push({ path: PageEnum.LOGIN_ACCOUNTS });
};
const goRegister = () => {
  const target = networkStore.queryTradeLines.find((e) => e.isOfficial === "1");
  if (target) {
    const server = target.lineName;
    router.push({ name: "Register", params: { server } });
  } else {
    ElMessage.warning(t("tip.noSimuServer"));
  }
};
const goForgetPassword = () => {
  router.push({ name: "ForgetPassword", params: { server: formState.server } });
};

const pwd = ref();
onMounted(() => {
  // 记住密码自动填充
  if (query.login) {
    formState.login = String(query.login);
    formState.remember = false;
    pwd.value.focus();
  }
  if (query.server) {
    formState.server = String(query.server);
  }
  document.addEventListener("keydown", handleKeydown);
});

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    happyStart("keydown");
  }
}
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped lang="scss">
@import "@/styles/_handle.scss";
.Login {
  padding: 0 32px;
  position: relative;
  height: calc(100% - 55px);
  overflow: auto;
  box-sizing: border-box;
  .plogin {
    font-size: 24px;
    height: 40px;
    line-height: 40px;
    display: block;
  }
  .padd {
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    display: block;
    @include font_color("word-gray");
  }
}

.login-form {
  margin-top: 24px;
  width: 100%;
  font-size: 16px !important;
  &-remember {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &-account {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  &-button {
    width: 100%;
  }
}

.link {
  @include font_color("word-gray");
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
  &:active {
    @include font_color("primary-active");
  }
}

.article {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 56px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: auto;
}
[data-theme="light"] .article {
  background-color: #fff9eb;
}
[data-theme="dark"] .article {
  background: #262b35;
}
</style>

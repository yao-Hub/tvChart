<template>
  <div class="loginList">
    <ScanCode></ScanCode>

    <div class="Login">
      <el-scrollbar view-class="loginScrollbarView">
        <div class="login_container">
          <div class="backBox">
            <el-icon class="backBox_icon" @click="goAccount" v-if="ifloginBack">
              <BaseImg iconName="turnleft" />
            </el-icon>
            <span class="plogin">{{
              ifloginBack ? t("addAccount") : t("logAccount")
            }}</span>
          </div>
          <span class="padd">{{ t("noAccount") }}</span>
          <el-form
            ref="ruleFormRef"
            :model="formState"
            label-position="top"
            class="login-form"
            :rules="rules"
          >
            <el-form-item prop="server" :label="t('order.tradingRoute')">
              <el-popover
                placement="bottom-start"
                :visible="visible"
                :show-arrow="false"
                width="100%"
                popper-class="lines-popover"
                :teleported="false"
              >
                <template #reference>
                  <el-input
                    v-model="inputLine"
                    :placeholder="linePlaceholder"
                    clearable
                    @clear="linesClear"
                    @input="linesInput"
                    @focus="linesFoucus"
                    @blur="linesBlur"
                  >
                    <template #suffix>
                      <BaseImg iconName="icon_search"></BaseImg>
                    </template>
                  </el-input>
                </template>
                <template #default>
                  <div v-if="linesLoading" class="lines-type">
                    <span>{{ t("tip.loading") }}</span>
                  </div>
                  <div
                    v-if="!linesLoading && tadeLines.length !== 0"
                    class="lines-content"
                    @mouseleave="mouseEnterLineName = ''"
                  >
                    <el-scrollbar max-height="120px">
                      <div
                        class="lines-content_option"
                        v-for="item in tadeLines"
                        :key="item.lineName"
                        @mouseenter="mouseEnterLineName = item.lineName"
                        @click="choseLine(item.lineName)"
                      >
                        <span>{{ item.lineName }}</span>
                        <el-text
                          type="primary"
                          v-show="mouseEnterLineName === item.lineName"
                          @click.stop="watchDetail(item.brokerName)"
                        >
                          {{ t("serverInfo.seeDetail") }}
                        </el-text>
                      </div>
                    </el-scrollbar>
                  </div>
                  <div
                    v-if="!linesLoading && tadeLines.length === 0"
                    class="lines-type"
                  >
                    <span>{{ t("tip.noneData") }}</span>
                  </div>
                </template>
              </el-popover>
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

            <div class="login-form-account">
              <span> {{ t("account.noAccount") }}&nbsp;</span>
              <el-text type="primary" @click="goRegister">
                {{ t("account.createAccount") }}
              </el-text>
            </div>
          </el-form>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import {
  ElMessage,
  ElNotification,
  type FormInstance,
  type FormRules,
} from "element-plus";
import { debounce, uniqBy } from "lodash";

import { PageEnum } from "@/constants/pageEnum";
import { sendTrack } from "@/utils/track";
import plugins from "@/plugins/propsComponents";
import {
  queryTradeLine,
  resQueryTradeLine,
  protocolAgree,
} from "api/account/index";

import { useDialog } from "@/store/modules/dialog";
import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";

import ScanCode from "./ScanCode.vue";

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
  return !(formState.login && formState.password && formState.server);
});

const ifloginBack = computed(() => {
  return userStore.state.accountList.length;
});

// 筛选服务器失焦不清除筛选信息
const visible = ref(false);
const linesLoading = ref(false);
const inputLine = ref("");
const tadeLines = ref<resQueryTradeLine[]>([]);
const linePlaceholder = ref(t("tip.serverRequired"));
const linesClear = () => {
  formState.server = "";
};
const linesInput = (val: string) => {
  getTraderLines(val);
  if (!inputLine.value) {
    linePlaceholder.value = formState.server || t("tip.serverRequired");
  } else {
    linePlaceholder.value = t("tip.serverRequired");
  }
};
const linesFoucus = async () => {
  const target = tadeLines.value.find(
    (item) => item.lineName === inputLine.value
  );
  if (target) {
    linePlaceholder.value = inputLine.value;
  }
  getTraderLines(inputLine.value);
  visible.value = true;
};
const linesBlur = () => {
  visible.value = false;
  if (!formState.server) {
    linePlaceholder.value = t("tip.serverRequired");
  }
};
// 获取服务器列表
const getTraderLines = debounce(
  (lineName: string) => {
    linesLoading.value = true;
    try {
      queryTradeLine({ lineName }).then((res) => {
        tadeLines.value = res.data;
        const globalLines = networkStore.queryTradeLines;
        globalLines.push(...res.data);
        networkStore.queryTradeLines = uniqBy(globalLines, "lineName");
      });
    } finally {
      linesLoading.value = false;
    }
  },
  250,
  { leading: false }
);
const choseLine = (lineName: string) => {
  formState.server = lineName;
  inputLine.value = lineName;
};
const mouseEnterLineName = ref("");
const watchDetail = (server: string) => {
  plugins.serverInfoPlugin.mount({
    server,
  });
  useDialog().openDialog("serverVisible");
};

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

const happyStart = async (actionObject: string) => {
  try {
    if (disabled.value) {
      return;
    }
    loading.value = true;
    const target = networkStore.queryTradeLines.find(
      (e) => e.lineName === formState.server
    );
    formState.login = formState.login.trim();
    if (target) {
      await protocolAgree({
        columnCodes: ["privacy-policy", "service-article"],
        brokerName: target.brokerName,
        lineName: target.lineName,
        login: formState.login,
      }).catch(() => (loading.value = false));
    }
    userStore.login(formState, ({ ending, success, errmsg }) => {
      loading.value = !ending;
      if (ending && success) {
        sendTrack({
          actionType: "signUp",
          actionObject,
        });
        router.push({ path: "/" });
      }
      if (ending && !success && errmsg) {
        ElNotification({
          message: errmsg,
          type: "error",
        });
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
let timer: ReturnType<typeof setTimeout>;
onMounted(() => {
  // 记住密码自动填充
  if (query.login) {
    formState.login = String(query.login);
    formState.remember = false;
    timer = setTimeout(() => {
      pwd.value.focus();
      clearTimeout(timer);
    }, 500);
  }
  if (query.server) {
    formState.server = String(query.server);
    inputLine.value = String(query.server);
  }
  document.addEventListener("keydown", handleKeydown);
});

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    happyStart("keydown");
  }
}
onUnmounted(() => {
  clearTimeout(timer);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss">
.lines-popover {
  padding: 0 !important;
}
</style>
<style scoped lang="scss">
@import "@/styles/_handle.scss";

:deep(.loginScrollbarView) {
  height: 100%;
}

.loginList {
  display: flex;
  height: 100%;
}

.Login {
  height: 100%;
  width: 560px;
  display: flex;
  flex-direction: column;
  padding: 32px 0;
  box-sizing: border-box;
}
.login_container {
  height: 100%;
  padding: 0 48px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  .backBox {
    display: flex;
    align-items: center;
    font-size: 24px;
    line-height: 40px;
    gap: 8px;
    position: sticky;
    top: 0;
    z-index: 9;
    @include background_color("background-login-container");
    &_icon {
      cursor: pointer;
    }
    .plogin {
      font-size: inherit;
      display: block;
    }
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
  flex: 1;
  margin-top: 24px;
  font-size: 16px !important;
  display: flex;
  flex-direction: column;
  position: relative;

  &-remember {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-account {
    width: 100%;
    text-align: center;
    margin-top: auto;
    height: 20px;
  }

  &-button {
    width: 100%;
  }
}

.lines-type {
  display: flex;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.lines-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 48px;
  &_option {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    width: 100%;
    padding: var(--el-popover-padding);
    box-sizing: border-box;
    &:hover {
      @include background_color("selectHover");
    }
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
</style>

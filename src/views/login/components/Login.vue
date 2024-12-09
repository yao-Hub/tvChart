<template>
  <div class="Login">
    <div class="back" @click="emit('goCom', 'accounts')" v-if="props.needBack">
      <el-icon>
        <img src="@/assets/icons/turnleft.svg" />
      </el-icon>
      <span>{{ $t("back") }}</span>
    </div>
    <span class="plogin">{{ $t("logAccount") }}</span>
    <span class="padd">{{ $t("noAccount") }}</span>
    <el-form
      ref="ruleFormRef"
      :model="formState"
      label-position="top"
      class="login-form"
      :rules="rules"
    >
      <el-form-item prop="server" :label="$t('order.tradingRoute')">
        <el-select
          v-model="formState.server"
          filterable
          default-first-option
          :suffix-icon="Search"
        >
          <el-option
            v-for="item in networkStore.queryTradeLines"
            :key="item.lineName"
            :label="item.lineName"
            :value="item.lineName"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="$t('user.login')" prop="login">
        <el-input v-model="formState.login" placeholder="Please input login" />
      </el-form-item>

      <el-form-item :label="$t('user.password')" prop="password">
        <el-input
          v-model="formState.password"
          type="password"
          placeholder="Please input password"
          show-password
        />
      </el-form-item>

      <el-form-item>
        <div class="login-form-remember">
          <el-checkbox
            v-model="formState.remember"
            :label="$t('account.rememberMe')"
          />
          <span
            class="link"
            v-if="formState.server === 'utrader-demo'"
            @click="emit('goCom', 'forgetPassword')"
            >{{ $t("account.forgetPassword") }}</span
          >
        </div>
      </el-form-item>

      <el-form-item>
        <el-button
          style="width: 100%"
          type="primary"
          :disabled="disabled"
          size="large"
          @click="happyStart"
          >{{ $t("account.login") }}</el-button
        >
      </el-form-item>

      <el-form-item>
        <div class="login-form-account">
          <span> {{ $t("account.noAccount") }}&nbsp;</span>
          <span class="link" @click="emit('goCom', 'register')">{{
            $t("account.createAccount")
          }}</span>
        </div>
      </el-form-item>
    </el-form>

    <div class="article">
      <span>{{ $t("article.loginsee") }}</span>
      <el-link
        type="primary"
        target="_blank"
        :href="serviceArticleUrl"
        :underline="false"
        >{{ $t("leftBook") }}{{ $t("article.userAgreement")
        }}{{ $t("rightBook") }}</el-link
      >
      <span> {{ $t("and") }} </span>
      <el-link
        type="primary"
        target="_blank"
        :href="privacyPolicyUrl"
        :underline="false"
        >{{ $t("leftBook") }}{{ $t("article.privacyPolicy")
        }}{{ $t("rightBook") }}</el-link
      >
      <span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { Search } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

const networkStore = useNetwork();
const userStore = useUser();

interface Props {
  login?: number | string;
  server?: string;
  needBack?: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["goCom", "goHome"]);

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
  remember: true,
});
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const rules = reactive<FormRules<typeof formState>>({
  server: [
    {
      required: true,
      trigger: "change",
      message: "Please select tradingRoute!",
    },
  ],
  login: [
    {
      required: true,
      trigger: "change",
      message: "Please input your login!",
    },
  ],
  password: [
    {
      required: true,
      message: "Please input your password!",
      trigger: "change",
    },
  ],
});

const disabled = computed(() => {
  return !(formState.login && formState.password);
});

import { articleDetails, protocolAgree } from "api/account/index";
// 隐私协议
const privacyPolicyUrl = ref("");
// 用户协议
const serviceArticleUrl = ref("");
(async function getProtoco() {
  const [privacyPolicy, serviceArticle] = await Promise.all([
    articleDetails({ columnCode: "privacy-policy", articleCode: "" }),
    articleDetails({ columnCode: "service-article", articleCode: "" }),
  ]);
  privacyPolicyUrl.value = privacyPolicy.data.url;
  serviceArticleUrl.value = serviceArticle.data.url;
})();

const happyStart = async () => {
  try {
    const target = networkStore.queryTradeLines.find(
      (e) => e.lineName === formState.server
    );
    if (target) {
      protocolAgree({
        protocolName: "2",
        brokerName: target.brokerName,
        lineName: target.lineName,
        login: formState.login,
      });
    }
    await userStore.login(formState, ({ ending }) => {
      loading.value = !ending;
    });
    emit("goHome");
  } catch (e) {
    loading.value = false;
  }
};

onMounted(() => {
  // 记住密码自动填充
  if (props.login) {
    formState.login = String(props.login);
    formState.remember = false;
  }
  if (props.server) {
    formState.server = String(props.server);
  }
  document.addEventListener("keydown", function (event) {
    if (disabled.value) {
      return;
    }
    if (event.key === "Enter") {
      happyStart();
    }
  });
});
</script>

<style scoped lang="scss">
@import "@/styles/_handle.scss";
.Login {
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
  padding: 56px 32px 0 32px;
  .plogin {
    font-weight: bold;
    font-size: 28px;
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
  .back {
    display: flex;
    position: absolute;
    top: 18px;
    gap: 4px;
    left: 32px;
    cursor: pointer;
  }
}

.login-form {
  margin-top: 32px;
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
}

.article {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 16px 32px;
  background-color: #fff9eb;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>

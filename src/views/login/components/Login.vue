<template>
  <div class="Login">
    <div class="back" @click="emit('goCom', 'accounts')" v-if="props.needBack">
      <el-icon>
        <img src="@/assets/icons/turnleft.svg" />
      </el-icon>
      <span>返回</span>
    </div>
    <span class="plogin">登录您的账号</span>
    <span class="padd">已有交易账号，可直接登录，如没有，可开模</span>
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
          <span class="link" @click="emit('goCom', 'forgetPassword')">{{
            $t("account.forgetPassword")
          }}</span>
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
          <span> {{ $t("account.noAccount") }}</span>
          <span class="link" @click="emit('goCom', 'register')">{{
            $t("account.createAccount")
          }}</span>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";

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

// 记住密码自动填充
if (props.login) {
  formState.login = String(props.login);
  formState.remember = false;
}
if (props.server) {
  formState.server = String(props.server);
}

const happyStart = async () => {
  try {
    await userStore.login(formState, ({ ending }) => {
      loading.value = !ending;
    });
    emit("goHome");
  } catch (e) {
    loading.value = false;
  }
};

const disabled = computed(() => {
  return !(formState.login && formState.password);
});
</script>

<style scoped lang="scss">
@import "@/styles/_handle.scss";
.Login {
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
  padding: 56px 32px;
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
</style>

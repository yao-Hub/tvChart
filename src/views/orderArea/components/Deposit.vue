<template>
  <div>
    <el-button type="primary" @click="openDialog">{{
      t("table.deposit")
    }}</el-button>

    <el-dialog
      v-model="visabled"
      v-if="visabled"
      width="416"
      :zIndex="dialogStore.zIndex"
      draggable
      overflow
      align-center
      :show-close="false"
      @close="handleCancel"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog_title">
          <span :id="titleId" :class="titleClass"
            >{{ t("account.accountNum") }}：{{ useUser().account.login }}</span
          >
          <el-icon class="closeBtn" @click="close"><Close /></el-icon>
        </div>
      </template>

      <div class="container">
        <el-form
          v-if="state === 'amount'"
          label-position="top"
          :model="amountForm"
          :rules="amountRules"
          ref="amountFormRef"
        >
          <el-form-item prop="amount">
            <template #label>
              <div class="label">
                <el-text
                  >{{ t("deposit.amount") }} {{ loginInfo?.currency }}</el-text
                >
                <el-text type="info">{{
                  `${t("deposit.amount")} ≤ 1000000`
                }}</el-text>
              </div>
            </template>
            <el-input
              v-model="amountForm.amount"
              :placeholder="t('tip.depositRequired')"
            />
            <el-form-item>
              <el-text type="info"
                >{{ t("order.balance") }}：{{ loginInfo?.balance }}
                {{ loginInfo?.currency }}</el-text
              >
            </el-form-item>
          </el-form-item>
        </el-form>

        <el-form
          v-if="state === 'email'"
          label-position="top"
          :rules="emailRules"
          ref="emailFormRef"
          :model="emailForm"
        >
          <el-form-item prop="email" :label="t('account.email')">
            <el-autocomplete
              v-model="emailForm.email"
              :fetch-suggestions="querySearch"
              :trigger-on-focus="false"
              clearable
              :placeholder="t('tip.emailRequired')"
            />
          </el-form-item>

          <el-form-item :label="t('account.verificationCode')" prop="code">
            <VerificationCode
              type="deposit"
              v-model:value="emailForm.code"
              :email="emailForm.email"
            ></VerificationCode>
          </el-form-item>
        </el-form>
      </div>

      <el-button
        v-if="state === 'amount'"
        type="primary"
        @click="deposit(amountFormRef)"
        :disabled="!amountForm.amount"
        class="btn"
        >{{ t("table.deposit") }}</el-button
      >

      <div v-if="state === 'email'" class="btnGroup">
        <el-button @click="state = 'amount'" class="btn">{{
          t("back")
        }}</el-button>
        <el-button
          type="primary"
          @click="goOn(emailFormRef)"
          class="btn"
          :loading="loading"
          >{{ t("deposit.goOn") }}</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElNotification } from "element-plus";
import { useI18n } from "vue-i18n";
import { get } from "lodash";
import dayjs from "dayjs";

import { logIndexedDB } from "utils/IndexedDB/logDatabase";
import { addBalance } from "api/account/index";

import { useDialog } from "@/store/modules/dialog";
import { useUser } from "@/store/modules/user";
import { useNetwork } from "@/store/modules/network";
import { useOrder } from "@/store/modules/order";

const { t } = useI18n();

const loginInfo = computed(() => useUser().state.loginInfo);

const dialogStore = useDialog();

const visabled = ref(false);

const state = ref<"amount" | "email">("amount");

const amountFormRef = ref<FormInstance>();
const amountForm = reactive({
  amount: "",
});
const checkAmount = (rule: any, value: any, callback: any) => {
  const regex = /^-?\d+(\.\d+)?$/;
  if (!regex.test(value)) {
    return callback(new Error(t("tip.numberFormatEror")));
  }
  if (!value) {
    return callback(new Error(t("tip.depositRequired")));
  }
  if (+value < 0) {
    return callback(new Error(`${t("deposit.amount")}${t("tip.need")}>0`));
  }
  if (+value > 1000000) {
    return callback(
      new Error(`${t("deposit.amount")}${t("tip.need")}≤1000000`)
    );
  }
  callback();
};
const amountRules = reactive<FormRules<typeof amountForm>>({
  amount: [{ validator: checkAmount, trigger: "blur" }],
});

interface FormState {
  email: string;
  code: string;
}
const emailForm = reactive<FormState>({
  code: "",
  email: useUser().state.loginInfo?.email || "",
});
const emailFormRef = ref<FormInstance>();
const emailRules = reactive<FormRules<typeof emailForm>>({
  email: [
    {
      required: true,
      trigger: "blur",
      message: t("tip.emailRequired"),
    },
    {
      type: "email",
      message: t("tip.correctEmail"),
      trigger: ["blur", "change"],
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

const openDialog = () => {
  dialogStore.incrementZIndex();
  visabled.value = true;
};

const deposit = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      state.value = "email";
    }
  });
};
const loading = ref(false);
const goOn = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;

      let errmsg = "";
      try {
        await addBalance({
          lineName: useNetwork().server,
          email: emailForm.email,
          verify_code: emailForm.code,
          profit: +amountForm.amount,
        });
        useOrder().getData("balance_order_added");
        ElNotification.success({
          title: t("tip.succeed", { type: t("table.deposit") }),
        });
        handleCancel();
        visabled.value = false;
      } catch (error) {
        errmsg =
          get(error, "errmsg") ||
          get(error, "message") ||
          JSON.stringify(error);
      } finally {
        loading.value = false;

        const login = useUser().account.login;
        const server = useUser().account.server;
        const logErr = errmsg ? `error ${errmsg}` : "";
        const detail = `${login}: deposit ${amountForm.amount} ${loginInfo.value?.currency} ${logErr}`;
        const logData = {
          logType: errmsg ? "error" : "info",
          logName: "deposit",
          detail,
          id: new Date().getTime(),
          origin: "trades",
          time: dayjs().format("YYYY.MM.DD HH:mm:ss.SSS"),
          login,
          server,
          day: dayjs().format("YYYY.MM.DD"),
        };
        await logIndexedDB.addData(logData);
        useOrder().getData("log");
      }
    }
  });
};

const handleCancel = () => {
  if (amountFormRef.value) {
    amountFormRef.value.resetFields();
  }
  if (emailFormRef.value) {
    emailFormRef.value.resetFields();
  }
  state.value = "amount";
};
</script>

<style lang="scss" scoped>
:deep(.el-form-item__label) {
  width: 100%;
  padding-right: 0;
}
.container {
  margin-top: 24px;
}
.btn {
  width: 100%;
}
.btnGroup {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.label {
  display: flex;
  width: 100%;
  justify-content: space-between;
}
</style>

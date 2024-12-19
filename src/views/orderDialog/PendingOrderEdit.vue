<template>
  <div>
    <el-dialog
      align-center
      width="464"
      v-model="modal"
      @close="handleCancel"
      :z-index="13"
      destroy-on-close
      append-to-body
    >
      <template #header>
        <span class="dialog_header">ID: {{ props.orderInfo.id }}</span>
      </template>
      <el-form :model="formState" :rules="rules" ref="orderFormRef">
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item
              prop="symbol"
              :label="t('table.symbol')"
              label-position="top"
            >
              <el-input disabled :value="props.orderInfo.symbol"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item
              prop="symbol"
              :label="t('dialog.orderType')"
              label-position="top"
            >
              <el-input
                disabled
                :value="getOrderType(props.orderInfo.type)"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            v-if="domVisableOption.orderPrice.includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.orderPrice"
              :formOption="{
                name: 'orderPrice',
                label: `${
                  formState.orderType.includes('Stop')
                    ? t('dialog.breakPrice')
                    : t('dialog.limitedPrice')
                }`,
              }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </el-col>
          <!-- 不是6 7都能改 是6 7考虑是否到达突破价 到达突破价不能改 只能改限价 -->
          <el-col
            :span="24"
            v-if="domVisableOption.breakPrice.includes(formState.orderType)"
          >
            <BreakLimit
              :disabled="!!orderInfo.order_price_time"
              v-model:value="formState.breakPrice"
              :formOption="{
                name: 'breakPrice',
                label: t('dialog.breakPrice'),
              }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            ></BreakLimit>
          </el-col>
          <el-col
            :span="24"
            v-if="domVisableOption.limitedPrice.includes(formState.orderType)"
          >
            <BreakLimit
              v-model:value="formState.limitedPrice"
              :breakPrice="formState.breakPrice"
              :formOption="{
                name: 'limitedPrice',
                label: t('dialog.limitedPrice'),
              }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            ></BreakLimit>
          </el-col>
          <el-col :span="24">
            <Volume
              disabled
              v-model:volume="formState.volume"
              :symbolInfo="symbolInfo"
              :quote="quote"
              :orderType="formState.orderType"
              :formOption="{ name: 'volume', label: t('dialog.closeVolume') }"
              :orderPrice="formState.orderPrice"
            ></Volume>
          </el-col>
          <el-col :span="12">
            <StopLossProfit
              type="stopLoss"
              v-model:price="formState.stopLoss"
              :volume="formState.volume"
              :symbolInfo="symbolInfo"
              :quote="quote"
              :orderPrice="formState.orderPrice"
              :orderType="formState.orderType"
              :limitedPrice="formState.limitedPrice"
            ></StopLossProfit>
          </el-col>
          <el-col :span="12">
            <StopLossProfit
              type="stopProfit"
              v-model:price="formState.stopProfit"
              :volume="formState.volume"
              :symbolInfo="symbolInfo"
              :quote="quote"
              :orderPrice="formState.orderPrice"
              :orderType="formState.orderType"
              :limitedPrice="formState.limitedPrice"
            ></StopLossProfit>
          </el-col>
          <el-col
            :span="24"
            v-if="domVisableOption.dueDate.includes(formState.orderType)"
          >
            <Term v-model:term="formState.dueDate"></Term>
          </el-col>
          <el-col :span="24">
            <Spread :quote="props.quote" :digits="symbolInfo?.digits"></Spread>
          </el-col>
          <el-col :span="24">
            <div class="btns">
              <el-button style="flex: 1" @click="delPendingOrder">{{
                $t("delete")
              }}</el-button>
              <el-button
                style="flex: 1"
                type="primary"
                :loading="editing"
                @click="confirmEdit"
                >{{ $t("tip.confirm", { type: t("modify") }) }}</el-button
              >
            </div>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { debounce, findKey } from "lodash";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ORDERMAP } from "@/constants/common";
import { resPendingOrders } from "api/order/index";
import type { FormInstance, FormRules } from "element-plus";
import { getOrderType } from "utils/order/index";

import BreakLimit from "./components/BreakLimit.vue";
import Price from "./components/Price.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Volume from "./components/Volume.vue";
import Spread from "./components/spread.vue";

import { useOrder } from "@/store/modules/order";
import { useTime } from "@/store/modules/time";

const { t } = useI18n();

const timeStore = useTime();
const orderStore = useOrder();
interface Props {
  orderInfo: resPendingOrders;
  quote: IQuote;
}
const props = defineProps<Props>();
const emit = defineEmits();
const modal = defineModel("visible", { type: Boolean, default: false });
const handleCancel = () => {
  orderFormRef.value?.resetFields();
  modal.value = false;
};

/** 表单处理 */
const orderFormRef = ref<FormInstance>();
interface FormState {
  symbol: string;
  orderType: string;
  volume: string | number;
  stopLoss: string;
  stopProfit: string;
  orderPrice: string;
  dueDate: string | number;
  breakPrice: string | number;
  limitedPrice: string | number;
}
const formState = reactive<FormState>({
  symbol: "",
  orderType: "",
  volume: "",
  stopLoss: "",
  stopProfit: "",
  orderPrice: "",
  dueDate: "",
  breakPrice: "",
  limitedPrice: "",
});
const domVisableOption = {
  orderPrice: ["buyLimit", "sellLimit", "buyStop", "sellStop"],
  breakPrice: ["buyStopLimit", "sellStopLimit"],
  limitedPrice: ["buyStopLimit", "sellStopLimit"],
  dueDate: [
    "buyLimit",
    "sellLimit",
    "buyStop",
    "sellStop",
    "buyStopLimit",
    "sellStopLimit",
  ],
} as Record<string, string[]>;
for (const i in formState) {
  if (!domVisableOption[i]) {
    domVisableOption[i] = [
      "",
      "buyLimit",
      "sellLimit",
      "buyStop",
      "sellStop",
      "buyStopLimit",
      "sellStopLimit",
    ];
  }
}
// 重置表单 自动填充
watch(
  () => modal.value,
  async (val) => {
    if (val) {
      const timezone = timeStore.settedTimezone;
      await nextTick();
      const orderType = findKey(ORDERMAP, (o) => o === props.orderInfo.type);
      if (orderType) {
        formState.orderType = orderType;
      }
      formState.symbol = props.orderInfo.symbol;
      formState.volume = props.orderInfo.volume / 100;
      formState.stopLoss = String(props.orderInfo.sl_price);
      formState.stopProfit = String(props.orderInfo.tp_price);
      formState.dueDate = dayjs(props.orderInfo.time_expiration)
        .tz(timezone)
        .unix();
      formState.limitedPrice = props.orderInfo.trigger_price;
      formState.breakPrice = props.orderInfo.order_price;
      setTimeout(() => {
        formState.orderPrice = String(props.orderInfo.order_price);
      }, 200);
    }
  }
);

// 期限规则
const validDate = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error(t("tip.termRequired")));
  }
  const timezone = timeStore.settedTimezone;
  const distanceFromNow = dayjs.unix(value).tz(timezone).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return callback(new Error(t("tip.noLessNowTime")));
  }
  callback();
};
const rules: FormRules<typeof formState> = {
  orderType: [{ required: true, trigger: "change" }],
  volume: [{ required: true, trigger: "change" }],
  dueDate: [{ required: true, trigger: "change", validator: validDate }],
  breakPrice: [{ required: true, trigger: "change" }],
  limitedPrice: [{ required: true, trigger: "change" }],
};

/** 当前品种 */
import { IQuote } from "#/chart/index";
import { useSymbols } from "@/store/modules/symbols";
const symbolsStore = useSymbols();
const symbolInfo = computed(() => {
  return symbolsStore.symbols.find((e) => e.symbol === formState.symbol);
});

/** 当前报价 */
const quote = ref<IQuote>();
watch(
  () => [orderStore.currentQuotes, formState.symbol],
  () => {
    const quotes = orderStore.currentQuotes;
    const formSymbol = formState.symbol;
    if (quotes && quotes[formSymbol]) {
      quote.value = quotes[formSymbol];
    }
  },
  { immediate: true, deep: true }
);

/** 下单 */
const valids = async () => {
  let result: boolean = false;
  if (orderFormRef.value) {
    result = await orderFormRef.value
      .validateField()
      .then((res) => res)
      .catch((e) => false);
  }
  return result;
};

import { editPendingOrders, reqPendingOrdersAdd } from "api/order/index";
import { ElMessage } from "element-plus";
const editing = ref(false);
const confirmEdit = debounce(async () => {
  try {
    editing.value = true;
    const values = await valids();
    if (values) {
      const updata: reqPendingOrdersAdd = {
        symbol: formState.symbol,
        type: ORDERMAP[formState.orderType],
        volume: +formState.volume * 100,
        order_price: +formState.orderPrice,
        time_expiration: +formState.dueDate,
      };
      if (["buyStopLimit", "sellStopLimit"].includes(formState.orderType)) {
        updata.trigger_price = +formState.limitedPrice;
        updata.order_price = +formState.breakPrice;
      }
      if (formState.stopLoss !== "") {
        updata.sl = +formState.stopLoss;
      }
      if (formState.stopProfit !== "") {
        updata.tp = +formState.stopProfit;
      }
      const res = await editPendingOrders({
        ...updata,
        id: props.orderInfo.id,
      });
      if (res.data.action_success) {
        ElMessage.success(t("tip.succeed", { type: t("modify") }));
        handleCancel();
      } else {
        ElMessage.error(
          `${t("tip.failed", { type: t("modify") })}：${res.data.err_text}`
        );
      }
    }
  } finally {
    editing.value = false;
  }
}, 20);

import { delPendingOrders } from "api/order/index";
import { ElMessageBox } from "element-plus";

const delPendingOrder = () => {
  ElMessageBox.confirm("", t("tip.confirm", { type: t("delete") })).then(
    async () => {
      const res = await delPendingOrders({
        id: props.orderInfo.id,
        symbol: props.orderInfo.symbol,
      });
      if (res.data.action_success) {
        ElMessage.success(t("dialog.pendingClosingSuccessfully"));
        handleCancel();
        return;
      }
      ElMessage.error(res.data.err_text);
    }
  );
};
</script>

<style lang="scss"></style>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.sellBtn,
.buyBtn {
  border-radius: 4px;
  @include font_color("background-component");
}
:deep(.el-overlay) {
  background-color: transparent;
  pointer-events: none;
}
:deep(.el-dialog) {
  pointer-events: auto;
}
:deep(.el-col) {
  margin-bottom: 14px;
}
:deep(.el-row) {
  margin-top: 14px;
}
.dialog_header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}
.label {
  @include font_color("word-gray");
  display: block;
  min-width: 75px;
  text-align: left;
}
.value {
  @include font_color("word");
  display: block;
}
.btns {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}
</style>

<template>
  <div>
    <el-dialog
      align-center
      width="464"
      v-model="props.visible"
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
          <el-col :span="12">
            <el-form-item prop="symbol" label="交易品种" label-position="top">
              <el-input disabled :value="props.orderInfo.symbol"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              prop="orderType"
              label="订单类型"
              label-position="top"
            >
              <el-select
                v-model="formState.orderType"
                filterable
                placeholder="订单类型"
              >
                <el-option
                  v-for="item in orderTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col
            :span="12"
            v-if="domVisableOption.orderPrice.includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.orderPrice"
              edit
              :formOption="{
                name: 'orderPrice',
                label: `${
                  formState.orderType.includes('Stop') ? '突破价' : '限价'
                }`,
              }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </el-col>
          <el-col
            :span="
              domVisableOption.volume.includes(formState.orderType) ? 24 : 12
            "
          >
            <el-form-item prop="volume" label="交易量" label-position="top">
              <Volume
                v-model:volume="formState.volume"
                :symbolInfo="symbolInfo"
                :quote="quote"
              ></Volume>
            </el-form-item>
          </el-col>
          <el-col
            :span="12"
            v-if="domVisableOption.breakPrice.includes(formState.orderType)"
          >
            <BreakLimit
              edit
              v-model:value="formState.breakPrice"
              :formOption="{ name: 'breakPrice', label: '突破价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            ></BreakLimit>
          </el-col>
          <el-col
            :span="12"
            v-if="domVisableOption.limitedPrice.includes(formState.orderType)"
          >
            <BreakLimit
              edit
              v-model:value="formState.limitedPrice"
              :breakPrice="formState.breakPrice"
              :formOption="{ name: 'limitedPrice', label: '限价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            ></BreakLimit>
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
            <el-form-item name="dueDate" label="期限">
              <Term v-model:term="formState.dueDate"></Term>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <div style="display: flex; flex-wrap: nowrap; width: 100%">
                <span class="sellWord" style="width: 50%"
                  >卖价: {{ formState.symbol ? quote.bid : "" }}</span
                >
                <span class="buyWord" style="width: 50%"
                  >买价: {{ formState.symbol ? quote.ask : "" }}</span
                >
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <div style="display: flex; justify-content: flex-end">
                <el-button
                  type="primary"
                  :loading="pendingBtnLoading"
                  @click="confirmEdit"
                  >确认修改</el-button
                >
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from "vue";
import { debounce, findKey } from "lodash";
import dayjs from "dayjs";

import type { FormInstance, FormRules } from "element-plus";
import { resOrders } from "api/order/index";
import { ORDERMAP } from "@/constants/common";

import Volume from "./components/Volume.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Price from "./components/Price.vue";
import BreakLimit from "./components/BreakLimit.vue";

import { useOrder } from "@/store/modules/order";

const orderStore = useOrder();
interface Props {
  visible: boolean;
  orderInfo: resOrders;
  quote: Quote;
}
const props = defineProps<Props>();
const emit = defineEmits();
const handleCancel = () => {
  orderFormRef.value?.resetFields();
  emit("update:visible", false);
};
// 订单类型
const orderTypeOptions = [
  { value: "buyLimit", label: "buy limit" },
  { value: "sellLimit", label: "sell limit" },
  { value: "buyStop", label: "buy stop" },
  { value: "sellStop", label: "sell stop" },
  { value: "buyStopLimit", label: "buy stop limit" },
  { value: "sellStopLimit", label: "sell stop limit" },
];

/** 表单处理 */
const orderFormRef = ref<FormInstance>();
interface FormState {
  symbol: string;
  orderType: string;
  volume: string | number;
  stopLoss: string | number;
  stopProfit: string | number;
  orderPrice: string | number;
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
  volume: ["", "price", "buyStopLimit", "sellStopLimit"],
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
  () => props.visible,
  (val) => {
    if (val) {
      const orderType = findKey(ORDERMAP, (o) => o === props.orderInfo.type);
      if (orderType) {
        formState.orderType = orderType;
      }
      formState.symbol = props.orderInfo.symbol;
      formState.volume = props.orderInfo.volume / 100;
      formState.stopLoss = props.orderInfo.sl_price;
      formState.stopProfit = props.orderInfo.tp_price;
      formState.orderPrice = props.orderInfo.order_price;
      formState.dueDate = dayjs(props.orderInfo.time_expiration).unix();
      formState.limitedPrice = props.orderInfo.trigger_price;
      formState.breakPrice = props.orderInfo.order_price;
    }
  }
);

// 期限规则
const validDate = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error("请选择期限"));
  }
  const distanceFromNow = dayjs.unix(value).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return callback(new Error("时间不能小于当前时间"));
  }
  callback();
};
const rules: FormRules<typeof formState> = {
  orderType: [{ required: true, trigger: "change", message: "请选择订单类型" }],
  volume: [{ required: true, trigger: "change", message: "请输入交易量" }],
  dueDate: [{ required: true, trigger: "change", validator: validDate }],
  breakPrice: [{ required: true, trigger: "change" }],
  limitedPrice: [{ required: true, trigger: "change" }],
};

/** 当前品种 */
import { useChartSub } from "@/store/modules/chartSub";
import { Quote } from "#/chart/index";
const subStore = useChartSub();
const symbolInfo = computed(() => {
  return subStore.symbols.find((e) => e.symbol === formState.symbol);
});

/** 当前报价 */
const quote = ref<Quote>({
  ask: 0,
  bid: 0,
  ctm_ms: 0,
  ctm: 0,
  symbol: "",
  server: "",
});
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
const pendingBtnLoading = ref(false);
const confirmEdit = debounce(async () => {
  try {
    pendingBtnLoading.value = true;
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
        ElMessage.success(`修改成功`);
        handleCancel();
      } else {
        ElMessage.error(`修改失败：${res.data.err_text}`);
      }
    }
  } finally {
    pendingBtnLoading.value = false;
  }
}, 20);
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
</style>

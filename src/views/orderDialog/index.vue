<template>
  <div>
    <el-dialog
      v-model="dialogStore.orderDialogVisible"
      width="464"
      draggable
      overflow
      align-center
      :zIndex="10"
      destroy-on-close
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <template #header>
        <span class="dialog_header">下单</span>
      </template>
      <el-form :model="formState" :rules="rules" ref="orderFormRef">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item prop="symbol" label="交易品种" label-position="top">
              <SymbolSelect
                style="width: 100%"
                v-model="formState.symbol"
                :selectOption="{ clearable: true }"
              ></SymbolSelect>
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
            v-if="
              ['buyLimit', 'sellLimit', 'buyStop', 'sellStop'].includes(
                formState.orderType
              )
            "
          >
            <Price
              v-model:value="formState.orderPrice"
              :formOption="{ name: 'orderPrice', label: '下单价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </el-col>
          <el-col
            :span="
              ['', 'price', 'buyStopLimit', 'sellStopLimit'].includes(
                formState.orderType
              )
                ? 24
                : 12
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
            v-if="
              ['buyStopLimit', 'sellStopLimit'].includes(formState.orderType)
            "
          >
            <BreakLimit
              v-model:value="formState.breakPrice"
              :formOption="{ name: 'breakPrice', label: '突破价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            ></BreakLimit>
          </el-col>
          <el-col
            :span="12"
            v-if="
              ['buyStopLimit', 'sellStopLimit'].includes(formState.orderType)
            "
          >
            <BreakLimit
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
              :orderType="
                formState.orderType === 'price'
                  ? `${ifCreateSell ? 'sell' : 'buy'}Price`
                  : formState.orderType
              "
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
              :orderType="
                formState.orderType === 'price'
                  ? `${ifCreateSell ? 'sell' : 'buy'}Price`
                  : formState.orderType
              "
            ></StopLossProfit>
          </el-col>
          <el-col
            :span="24"
            v-if="!['', 'price'].includes(formState.orderType)"
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
          <el-col :span="12" v-if="['', 'price'].includes(formState.orderType)">
            <el-form-item>
              <div style="display: flex; justify-content: space-evenly">
                <el-button
                  class="sellBtn"
                  :disabled="!ifCreateSell"
                  :loading="priceBtnLoading"
                  @click="showConfirmModal('sell')"
                  >卖出</el-button
                >
                <el-button
                  class="buyBtn"
                  :disabled="!ifCreateBuy"
                  :loading="priceBtnLoading"
                  @click="showConfirmModal('buy')"
                  >买入</el-button
                >
              </div>
            </el-form-item>
          </el-col>
          <el-col
            :span="12"
            v-if="!['', 'price'].includes(formState.orderType)"
          >
            <el-form-item>
              <div style="display: flex; justify-content: flex-end">
                <el-button
                  :class="[
                    formState.orderType.includes('sell') ? 'sellBtn' : 'buyBtn',
                  ]"
                  :loading="pendingBtnLoading"
                  @click="addPendingOrders"
                  >下单</el-button
                >
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>

    <!-- 下单确认 -->
    <el-dialog
      v-model="confirmOrderOpen"
      @cancel="handleConfirmOrderCancle"
      :width="400"
      align-center
      :zIndex="12"
    >
      <template #header>
        <span class="dialog_header">下单确认</span>
      </template>
      <el-row>
        <el-col :span="12" v-for="(value, key) in formState" v-show="!!value">
          <span class="label"> {{ formMap[key] }}： </span>
          <span class="value">
            {{ key === "orderType" ? directionType : value }}
          </span>
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="handleConfirmOrderCancle">修改</el-button>
        <el-button type="primary" @click="createPriceOrder">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from "vue";
import { debounce } from "lodash";
import Volume from "./components/Volume.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Price from "./components/Price.vue";
import BreakLimit from "./components/BreakLimit.vue";
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();

/** 弹窗处理 */
import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
const handleCancel = () => {
  dialogStore.closeOrderDialog();
};

/** 表单处理 */
import type { FormInstance, FormRules } from "element-plus";
const orderFormRef = ref<FormInstance>();
interface FormState {
  symbol: string;
  orderType: string;
  volume: string;
  stopLoss: string;
  stopProfit: string;
  orderPrice: string;
  dueDate: string;
  breakPrice: string;
  limitedPrice: string;
}
const formMap = {
  symbol: "交易品种",
  orderType: "订单类型",
  volume: "交易量",
  stopLoss: "止损",
  stopProfit: "止盈",
  orderPrice: "下单价",
  dueDate: "期限",
  breakPrice: "突破价",
  limitedPrice: "限价",
};
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
// 重置表单 自动填充
watch(
  () => dialogStore.orderDialogVisible,
  async (val) => {
    if (val) {
      await nextTick();
      orderFormRef.value?.resetFields();
      formState.symbol = orderStore.currentSymbol;
      formState.orderType = "price";
    }
  }
);
// 订单类型
const orderTypeOptions = [
  { value: "price", label: "市价" },
  { value: "buyLimit", label: "buy limit" },
  { value: "sellLimit", label: "sell limit" },
  { value: "buyStop", label: "buy stop" },
  { value: "sellStop", label: "sell stop" },
  { value: "buyStopLimit", label: "buy stop limit" },
  { value: "sellStopLimit", label: "sell stop limit" },
];
// 是否可以市价下单
const ifCreateSell = computed(() => {
  const stopLoss = formState.stopLoss;
  const stopProfit = formState.stopProfit;
  if (stopLoss === "" && stopProfit === "") {
    return true;
  }
  const ask = quote.value.ask;
  const bid = quote.value.bid;
  const checkAsk = ask && +stopLoss > ask;
  const checkBid = bid && +stopProfit < bid;
  if (stopLoss && stopProfit) {
    if (checkAsk && checkBid) {
      return true;
    }
  } else if (stopLoss && checkAsk) {
    return true;
  } else if (stopProfit && checkBid) {
    return true;
  }
  return false;
});
const ifCreateBuy = computed(() => {
  const stopLoss = formState.stopLoss;
  const stopProfit = formState.stopProfit;
  if (stopLoss === "" && stopProfit === "") {
    return true;
  }
  const ask = quote.value.ask;
  const bid = quote.value.bid;
  const checkAsk = ask && +stopProfit > ask;
  const checkBid = bid && +stopLoss < bid;
  if (stopLoss && stopProfit) {
    if (checkAsk && checkBid) {
      return true;
    }
  }
  if (stopLoss && checkBid) {
    return true;
  }
  if (stopProfit && checkAsk) {
    return true;
  }
  return false;
});
// 期限规则
import dayjs from "dayjs";
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
  symbol: [{ required: true, trigger: "change", message: "请输入品种" }],
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
const confirmOrderOpen = ref(false);
const handleConfirmOrderCancle = () => {
  confirmOrderOpen.value = false;
};
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
const directionType = ref();
const priceBtnLoading = ref(false);
const showConfirmModal = debounce(async (type: "sell" | "buy") => {
  const values = await valids();
  directionType.value = type;
  if (values) {
    confirmOrderOpen.value = true;
  }
}, 20);
// 市价单下单
import { ElNotification } from "element-plus";
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
const createPriceOrder = debounce(async () => {
  try {
    priceBtnLoading.value = true;
    const updata: ReqOrderAdd = {
      symbol: formState.symbol,
      type: directionType.value === "buy" ? 0 : 1,
      volume: +formState.volume * 100,
    };
    if (formState.stopLoss !== "") {
      updata.sl = +formState.stopLoss;
    }
    if (formState.stopProfit !== "") {
      updata.tp = +formState.stopProfit;
    }
    const res = await marketOrdersAdd(updata);
    if (res.data.action_success) {
      ElNotification({
        title: "下单成功",
        message: `${directionType.value !== "buy" ? "卖出" : "买入"}${
          formState.volume
        }手${formState.symbol}的订单已提交。`,
        type: "success",
      });
      handleConfirmOrderCancle();
      handleCancel();
      orderStore.refreshOrderArea = true;
    } else {
      ElNotification.error({
        title: "下单失败",
        message: `${res.data.err_text}`,
      });
    }
  } finally {
    priceBtnLoading.value = false;
  }
}, 20);
// 挂单下单
import { pendingOrdersAdd, reqPendingOrdersAdd } from "api/order/index";
import { ElMessage } from "element-plus";
import { ORDERMAP } from "@/constants/common";

const pendingBtnLoading = ref(false);
const addPendingOrders = debounce(async () => {
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
      const res = await pendingOrdersAdd(updata);
      if (res.data.action_success) {
        ElMessage.success(`下单成功`);
        handleCancel();
      } else {
        ElMessage.error(`下单失败：${res.data.err_text}`);
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
  font-size: 18px;
  @include font_color("word");
}
.label {
  @include font_color("word-gray");
}
.value {
  @include font_color("word");
}
</style>

<template>
  <div>
    <el-dialog
      v-model="dialogStore.orderDialogVisible"
      class="order_dialog scrollList"
      width="450"
      :zIndex="10"
      :modal="false"
      :close-on-click-modal="false"
      draggable
      overflow
      align-center
      destroy-on-close
      append-to-body
      @close="handleCancel"
      modal-class="order_dialog_modal"
    >
      <template #header>
        <span class="dialog_header">下单</span>
      </template>
      <el-form
        :model="formState"
        :rules="rules"
        ref="orderFormRef"
        style="margin-top: 32px"
      >
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item prop="symbol" label="交易品种" label-position="top">
              <SymbolSelect v-model="formState.symbol" subSymbol></SymbolSelect>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-radio-group
              v-model="formState.orderType"
              fill="#EFEFEF"
              text-color="#000"
            >
              <el-radio-button label="市价单" value="price" />
              <el-radio-button
                label="挂单"
                :value="
                  formState.orderType === 'price'
                    ? 'buyLimit'
                    : formState.orderType
                "
              />
            </el-radio-group>
            <div class="divider"></div>
          </el-col>
          <el-col :span="24" v-if="formState.orderType !== 'price'">
            <el-form-item prop="orderType" label="类型" label-position="top">
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
            :span="24"
            v-if="domVisableOption.breakPrice.includes(formState.orderType)"
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
            :span="24"
            v-if="domVisableOption.orderPrice.includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.orderPrice"
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
            :span="24"
            v-if="domVisableOption.limitedPrice.includes(formState.orderType)"
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
          <el-col :span="24">
            <Volume
              v-model:volume="formState.volume"
              :symbolInfo="symbolInfo"
              :quote="quote"
              :formOption="{ name: 'volume', label: '手数' }"
              :orderType="formState.orderType"
              :orderPrice="formState.orderPrice"
            ></Volume>
          </el-col>
          <el-col :span="12">
            <StopLossProfit
              style="width: 168px"
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
              style="width: 168px"
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
            <Spread :quote="quote" :digits="symbolInfo?.digits"></Spread>
          </el-col>
          <el-col :span="12" v-if="['', 'price'].includes(formState.orderType)">
            <el-button
              class="sellBtn"
              :loading="priceBtnLoading"
              @click="showConfirmModal('sell')"
              >卖出</el-button
            >
          </el-col>
          <el-col :span="12" v-if="['', 'price'].includes(formState.orderType)">
            <el-button
              class="buyBtn"
              :loading="priceBtnLoading"
              @click="showConfirmModal('buy')"
              >买入</el-button
            >
          </el-col>
          <el-col
            :span="24"
            v-if="!['', 'price'].includes(formState.orderType)"
          >
            <el-button
              :class="[
                formState.orderType.includes('sell') ? 'sellBtn' : 'buyBtn',
              ]"
              class="pendingBtn"
              :loading="pendingBtnLoading"
              @click="addPendingOrders"
              >下单</el-button
            >
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>

    <!-- 市价单下单确认 -->
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
      <div class="infos">
        <div class="infoItem">
          <el-text type="info">{{ $t("confirmOrder.symbol") }}</el-text>
          <el-text>{{ formState.symbol }}</el-text>
        </div>
        <div class="infoItem">
          <el-text type="info">{{ $t("confirmOrder.orderType") }}</el-text>
          <el-text>{{ directionType }}</el-text>
        </div>
        <div class="infoItem">
          <el-text type="info">{{ $t("confirmOrder.volume") }}</el-text>
          <el-text>{{ formState.volume }}</el-text>
        </div>
        <div class="infoItem">
          <el-text type="info">{{ $t("confirmOrder.stopProfit") }}</el-text>
          <el-text>{{ formState.stopProfit }}</el-text>
        </div>
        <div class="infoItem">
          <el-text type="info">{{ $t("confirmOrder.stopLoss") }}</el-text>
          <el-text>{{ formState.stopLoss }}</el-text>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleConfirmOrderCancle">修改</el-button>
        <el-button type="primary" @click="createPriceOrder">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash";
import { computed, nextTick, reactive, ref, watch } from "vue";

import BreakLimit from "./components/BreakLimit.vue";
import Price from "./components/Price.vue";
import Spread from "./components/spread.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Volume from "./components/Volume.vue";

import { useOrder } from "@/store/modules/order";
import { useSymbols } from "@/store/modules/symbols";

const symbolsStore = useSymbols();
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
      "price",
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
  { value: "buyLimit", label: "buy limit" },
  { value: "sellLimit", label: "sell limit" },
  { value: "buyStop", label: "buy stop" },
  { value: "sellStop", label: "sell stop" },
  { value: "buyStopLimit", label: "buy stop limit" },
  { value: "sellStopLimit", label: "sell stop limit" },
];
// 期限规则
import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
const timeStore = useTime();
const validDate = (rule: any, value: any, callback: any) => {
  const timezone = timeStore.settedTimezone;
  if (!value) {
    return callback(new Error("请选择期限"));
  }
  const distanceFromNow = dayjs.unix(value).tz(timezone).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return callback(new Error("时间不能小于当前时间"));
  }
  callback();
};
const rules: FormRules<typeof formState> = {
  dueDate: [{ required: true, trigger: "change", validator: validDate }],
  breakPrice: [{ required: true, trigger: "change" }],
  limitedPrice: [{ required: true, trigger: "change" }],
};

/** 当前品种 */
import { IQuote } from "#/chart/index";
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
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
import { ElNotification } from "element-plus";
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
import { ORDERMAP } from "@/constants/common";
import { pendingOrdersAdd, reqPendingOrdersAdd } from "api/order/index";
import { ElMessage } from "element-plus";

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

<style lang="scss">
@import "@/styles/_handle.scss";
.order_dialog {
  pointer-events: auto;
  max-height: 85vh;
  overflow: auto;
}
.order_dialog_modal {
  pointer-events: none;
}
</style>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-col) {
  padding: 0;
}
:deep(.el-radio-group) {
  width: 100%;
  display: flex;
}
:deep(.el-radio-button) {
  flex: 1;
}
:deep(.el-radio-button__inner) {
  width: 100%;
}
.dialog_header {
  font-size: 18px;
  font-weight: 500;
}
.divider {
  width: 100%;
  height: 1px;
  background: #dee2e9;
  margin: 24px 0;
}
.sellBtn,
.buyBtn {
  color: #fff !important;
  width: 168px;
  &:active {
    border: none;
  }
}
.pendingBtn {
  width: 100%;
  margin-top: 8px;
}
.infos {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: repeat(auto-fill, 20px);
  grid-row-gap: 8px;
  margin-top: 31px;
}
.infoItem span {
  display: inline-block;
  &:first-child {
    min-width: 86px;
  }
}
</style>

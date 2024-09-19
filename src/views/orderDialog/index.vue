<template>
  <div>
    <a-modal
      wrapClassName="orderDialog"
      :width="464"
      :open="open"
      @cancel="handleCancel"
      centered
      :footer="null"
      :mask="false"
      :maskClosable="false"
      :key="open"
    >
      <a-form
        ref="orderFormRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        size="large"
      >
        <a-row :gutter="24">
          <a-col :span="12">
            <a-form-item name="symbol" label="交易品种" validateFirst>
              <SymbolSelect
                style="width: 100%"
                v-model="formState.symbol"
                :selectOption="{ allowClear: true }"
              ></SymbolSelect>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item name="orderType" label="订单类型">
              <a-select
                v-model:value="formState.orderType"
                show-search
                placeholder="orderType"
                :options="orderTypeOptions"
                :filter-option="orderTypeFilterOption"
              ></a-select>
            </a-form-item>
          </a-col>
          <a-col
            :span="12"
            v-if="['buyLimit', 'sellLimit', 'buyStop', 'sellStop'].includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.orderPrice"
              :formOption="{ name: 'orderPrice', label: '下单价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </a-col>
          <a-col
            :span="['', 'price', 'buyStopLimit', 'sellStopLimit'].includes(formState.orderType) ? 24 : 12"
          >
            <a-form-item name="volume" label="交易量">
              <Volume
                v-model:volume="formState.volume"
                :symbolInfo="symbolInfo"
                :quote="quote"
              ></Volume>
            </a-form-item>
          </a-col>
          <a-col
            :span="12"
            v-if="['buyStopLimit', 'sellStopLimit'].includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.breakPrice"
              :formOption="{ name: 'breakPrice', label: '突破价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </a-col>
          <a-col
            :span="12"
            v-if="['buyStopLimit', 'sellStopLimit'].includes(formState.orderType)"
          >
            <Price
              v-model:value="formState.limitedPrice"
              :breakPrice="formState.breakPrice"
              :formOption="{ name: 'limitedPrice', label: '限价' }"
              :orderType="formState.orderType"
              :symbolInfo="symbolInfo"
              :quote="quote"
            >
            </Price>
          </a-col>
          <a-col :span="12">
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
          </a-col>
          <a-col :span="12">
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
          </a-col>
          <a-col :span="24" v-if="!['', 'price'].includes(formState.orderType)">
            <a-form-item name="dueDate" label="期限">
              <Term v-model:term="formState.dueDate"></Term>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <a-flex gap="16">
                <span class="sellWord" style="width: 50%"
                  >卖价: {{ formState.symbol ? quote.bid : "" }}</span
                >
                <span class="buyWord" style="width: 50%"
                  >买价: {{ formState.symbol ? quote.ask : "" }}</span
                >
              </a-flex>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="['', 'price'].includes(formState.orderType)">
            <a-form-item>
              <a-flex justify="space-evenly">
                <a-button
                  class="sellBtn"
                  type="primary"
                  :disabled="!ifCreateSell"
                  :loading="priceBtnLoading"
                  @click="showConfirmModal('sell')"
                  >卖出</a-button
                >
                <a-button
                  class="buyBtn"
                  type="primary"
                  :disabled="!ifCreateBuy"
                  :loading="priceBtnLoading"
                  @click="showConfirmModal('buy')"
                  >买入</a-button
                >
              </a-flex>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="!['', 'price'].includes(formState.orderType)">
            <a-form-item>
              <a-flex justify="flex-end">
                <a-button
                  :class="[
                    formState.orderType.includes('sell') ? 'sellBtn' : 'buyBtn',
                  ]"
                  type="primary"
                  :loading="pendingBtnLoading"
                  @click="addPendingOrders"
                  >下单</a-button
                >
              </a-flex>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <template #title>
        <div ref="modalTitleRef" style="width: 100%; cursor: move">下单</div>
      </template>
      <template #modalRender="{ originVNode }">
        <div :style="transformStyle">
          <component :is="originVNode" />
        </div>
      </template>
    </a-modal>

    <!-- 下单确认 -->
    <a-modal
      :open="confirmOrderOpen"
      @cancel="handleConfirmOrderCancle"
      title="下单确认"
      :width="400"
    >
      <a-flex wrap="wrap">
        <div
          style="width: 45%; margin: 8px 0"
          v-for="(value, key) in formState"
          v-show="!!value"
        >
          <span v-if="key === 'orderType'"
            >{{ formMap[key] }}: {{ directionType }}</span
          >
          <span v-else> {{ formMap[key] }}: {{ value }} </span>
        </div>
      </a-flex>
      <template #footer>
        <a-button @click="handleConfirmOrderCancle">修改</a-button>
        <a-button type="primary" @click="createPriceOrder">确认</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, watchEffect, nextTick } from "vue";
import { debounce } from "lodash";
import Volume from "./components/Volume.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Price from "./components/Price.vue";

/** 弹窗处理 */
import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
const open = computed(() => {
  return dialogStore.orderDialogVisible;
});
const handleCancel = () => {
  dialogStore.closeOrderDialog();
};
// 弹窗拖拽
import { CSSProperties } from "vue";
import { useDraggable } from "@vueuse/core";
const modalTitleRef = ref<HTMLElement>();
const { x, y, isDragging } = useDraggable(modalTitleRef);
const startX = ref<number>(0);
const startY = ref<number>(0);
const startedDrag = ref(false);
const transformX = ref(0);
const transformY = ref(0);
const preTransformX = ref(0);
const preTransformY = ref(0);
const dragRect = ref({ left: 0, right: 0, top: 0, bottom: 0 });
watch([x, y], () => {
  if (!startedDrag.value) {
    startX.value = x.value;
    startY.value = y.value;
    const bodyRect = document.body.getBoundingClientRect();
    if (modalTitleRef.value) {
      const titleRect = modalTitleRef.value.getBoundingClientRect();
      dragRect.value.right = bodyRect.width - titleRect.width;
      dragRect.value.bottom = bodyRect.height - titleRect.height;
      preTransformX.value = transformX.value;
      preTransformY.value = transformY.value;
    }
  }
  startedDrag.value = true;
});
watch(isDragging, () => {
  if (!isDragging) {
    startedDrag.value = false;
  }
});
watchEffect(() => {
  if (startedDrag.value) {
    transformX.value =
      preTransformX.value +
      Math.min(Math.max(dragRect.value.left, x.value), dragRect.value.right) -
      startX.value;
    transformY.value =
      preTransformY.value +
      Math.min(Math.max(dragRect.value.top, y.value), dragRect.value.bottom) -
      startY.value;
  }
});
const transformStyle = computed<CSSProperties>(() => {
  return {
    transform: `translate(${transformX.value}px, ${transformY.value}px)`,
  };
});

/** 表单处理 */
import type { FormInstance, SelectProps } from "ant-design-vue";
import type { Rule } from "ant-design-vue/es/form";
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
  () => open.value,
  async (val) => {
    if (val) {
      await nextTick();
      orderFormRef.value?.resetFields();
      formState.symbol = orderStore.currentSymbol;
      formState.orderType = "price";
    }
  },
  { flush: "post" }
);
// 订单类型
const orderTypeOptions = ref<SelectProps["options"]>([
  { value: "price", label: "市价" },
  { value: "buyLimit", label: "buy limit" },
  { value: "sellLimit", label: "sell limit" },
  { value: "buyStop", label: "buy stop" },
  { value: "sellStop", label: "sell stop" },
  { value: "buyStopLimit", label: "buy stop limit" },
  { value: "sellStopLimit", label: "sell stop limit" },
]);
const orderTypeFilterOption = (input: string, option: any) => {
  return option.label.includes(input);
};
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
const validDate = () => {
  const term = +formState.dueDate;
  if (!term) {
    return Promise.reject(`请选择期限`);
  }
  const distanceFromNow = dayjs.unix(term).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return Promise.reject(`时间不能小于当前时间`);
  }
  return Promise.resolve();
};
const rules: Record<string, Rule[]> = {
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
import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
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
  let result: any = false;
  if (orderFormRef.value) {
    result = await orderFormRef.value
      .validateFields()
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
}, 200);
// 市价单下单
import { notification } from "ant-design-vue";
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
      notification.success({
        message: "下单成功",
        description: `${directionType.value !== "buy" ? "卖出" : "买入"}${
          formState.volume
        }手${formState.symbol}的订单已提交。`,
        // icon: () => h(SmileOutlined, { style: 'color: #108ee9' }),
      });
      handleConfirmOrderCancle();
      handleCancel();
      orderStore.refreshOrderArea = true;
    } else {
      notification.error({
        message: "下单失败",
        description: `${res.data.err_text}`,
      });
    }
  } finally {
    priceBtnLoading.value = false;
  }
}, 200);
// 挂单下单
import { pendingOrdersAdd, reqPendingOrdersAdd } from "api/order/index";
import { message } from "ant-design-vue";
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
        trigger_price: +formState.limitedPrice,
        sl: +formState.stopLoss,
        tp: +formState.stopProfit,
        time_expiration: +formState.dueDate,
      };
      const res = await pendingOrdersAdd(updata);
      if (res.data.action_success) {
        message.success("下单成功");
        handleCancel();
      } else {
        message.error(`下单失败：${res.data.err_text}`);
      }
    }
  } finally {
    pendingBtnLoading.value = false;
  }
}, 200);
</script>

<style lang="scss">
.orderDialog {
  pointer-events: none;
}
</style>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.sellBtn,
.buyBtn {
  border-radius: 4px;
  @include font_color("background-component");
}
</style>

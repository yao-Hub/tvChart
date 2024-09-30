<template>
  <div ref="editRef">
    <a-modal
      wrapClassName="editModal"
      centered
      :getContainer="() => editRef"
      :width="464"
      :open="props.visible"
      @cancel="handleCancel"
    >
      <template #title>
        <div class="title">
          <span>ID: {{ props.orderInfo.id }}</span>
        </div>
      </template>
      <div class="container">
        <div class="container_top">
          <a-form
            ref="closeFormRef"
            :model="closeFormState"
            class="closeForm"
            layout="vertical"
            size="large"
          >
            <a-row :gutter="24">
              <a-col :span="24">
                <a-form-item name="symbol" label="交易品种">
                  <a-input
                    disabled
                    v-model:value="props.orderInfo.symbol"
                  ></a-input>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item name="transactionType" label="订单类型">
                  <a-input disabled :value="$t(`order.${transactionType}`)"></a-input>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item
                  name="volume"
                  label="平仓量"
                  :rules="[
                    {
                      required: true,
                      validator: validateVolume,
                      trigger: 'change',
                    },
                  ]"
                >
                  <a-flex style="width: 100%" gap="16">
                    <StepNumInput
                      :step="step"
                      v-model:value="closeFormState.volume"
                    ></StepNumInput>
                    <a-tooltip title="反向持仓">
                      <a-button class="iconbtn" @click="reversePositionConfirm">
                        <template #icon>
                          <RollbackOutlined />
                        </template>
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="双倍持仓">
                      <a-button class="iconbtn" @click="doubleHoldingsConfirm">
                        <template #icon>
                          <i class="iconfont icon-icon_2times"></i>
                        </template>
                      </a-button>
                    </a-tooltip>
                  </a-flex>
                </a-form-item>
              </a-col>
              <a-col :span="15" style="margin-top: 10px">
                <a-form-item>
                  <a-flex gap="16" justify="flex-start">
                    <span class="sellWord">卖价: {{ props.quote.bid }}</span>
                    <span class="buyWord">买价: {{ props.quote.ask }}</span>
                  </a-flex>
                </a-form-item>
              </a-col>
              <a-col :span="7" style="margin-top: 10px">
                <a-form-item>
                  <a-button
                    type="primary"
                    class="closeBtn"
                    @click="closeOrderConfirm"
                    >按市价平仓</a-button
                  >
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>
        </div>
        <a-form
          ref="stopFormRef"
          :model="stopFormState"
          class="stopForm"
          layout="vertical"
        >
          <a-row :gutter="24">
            <a-col :span="12">
              <StopLossProfit
                type="stopLoss"
                v-model:point="stopFormState.stopLoss"
                :symbolInfo="symbolInfo"
                :quote="props.quote"
                :orderType="combinationType"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
              ></StopLossProfit>
            </a-col>
            <a-col :span="12">
              <StopLossProfit
                type="stopProfit"
                v-model:point="stopFormState.stopProfit"
                :symbolInfo="symbolInfo"
                :quote="props.quote"
                :orderType="combinationType"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
              ></StopLossProfit>
            </a-col>
          </a-row>
        </a-form>
      </div>
      <template #footer>
        <a-button
          type="primary"
          class="btn"
          :loading="modifyLoading"
          @click="modify"
          >确认修改</a-button
        >
      </template>
    </a-modal>

    <a-modal
      :width="464"
      :open="confirmOpen"
      okText="确认"
      @ok="okCancel"
      @cancel="confirmCancel"
      :confirmLoading="confirmLoading"
    >
      <template #title>
        <span v-if="confirmType === 'close'">平仓确认</span>
        <span v-if="confirmType === 'reverse'">反向持仓</span>
        <span v-if="confirmType === 'double'">确定对当前持仓加倍吗</span>
      </template>
      <a-row :gutter="24" style="gap: 16px; flex-wrap: wrap; margin-top: 24px">
        <a-col :span="9">订单ID：{{ props.orderInfo.id }}</a-col>
        <a-col :span="9">交易品种：{{ props.orderInfo.symbol }}</a-col>
        <a-col :span="9">订单类型：{{ $t(`order.${confirmType === 'reverse' ? reverseType : transactionType}`) }}</a-col>
        <a-col :span="9">交易量：{{ closeFormState.volume }}</a-col>
      </a-row>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { resOrders } from "api/order/index";
import { Quote } from "#/chart/index";
import { RollbackOutlined } from "@ant-design/icons-vue";
interface Props {
  visible: boolean;
  orderInfo: resOrders;
  quote: Quote;
}
const props = defineProps<Props>();
const editRef = ref();
const emit = defineEmits();
const handleCancel = () => {
  emit("update:visible", false);
};

/** 当前品种 */
import { useChartSub } from "@/store/modules/chartSub";
const subStore = useChartSub();
const symbolInfo = computed(() => {
  return subStore.symbols.find((e) => e.symbol === props.orderInfo.symbol);
});

// 平仓表单
interface CloseFormState {
  volume: string | number;
}
const closeFormRef = ref();
const closeFormState = reactive<CloseFormState>({
  volume: "",
});
const validateVolume = async () => {
  const value = closeFormState.volume;
  if (value === "") {
    return Promise.reject("请输入手数");
  } else if (+value > props.orderInfo.volume / 100 || +value <= 0) {
    return Promise.reject("请输入合适范围的手数");
  } else {
    return Promise.resolve();
  }
};

// 止盈止损表单
interface StopFormState {
  stopLoss: string;
  stopProfit: string;
}
const stopFormState = reactive<StopFormState>({
  stopLoss: "",
  stopProfit: "",
});
const stopFormRef = ref();
import StopLossProfit from "./components/StopLossProfit.vue";
import { getTradingDirection, getOrderType } from "utils/order/index";
// buy or sell
const transactionType = computed(() => {
  return getTradingDirection(props.orderInfo.type);
});
// price or limit or stop or stopLimit
const orderType = computed(() => {
  return getOrderType(props.orderInfo.type);
});
const combinationType = computed(() => {
  return `${transactionType.value}${orderType.value}`;
});
const reverseType = computed(() => {
  return transactionType.value === 'sell' ? 'buy' : 'sell';
});

import { getDecimalPlaces } from "utils/common/index";
const step = computed(() => {
  let i = 1;
  if (props.orderInfo) {
    const places = getDecimalPlaces(props.orderInfo.volume / 100);
    i = i / Math.pow(10, places);
  }
  return String(i);
});

watch(
  () => props.visible,
  async (val) => {
    if (val) {
      await nextTick();
      await closeFormRef.value.resetFields();
      await stopFormRef.value.resetFields();
      closeFormState.volume = String(props.orderInfo.volume / 100);
      stopFormState.stopLoss = props.orderInfo.sl_price.toString();
      stopFormState.stopProfit = props.orderInfo.tp_price.toString();
    }
  },
  { deep: true }
);

import { marketOrdersClose } from "api/order/index";
import { useOrder } from "@/store/modules/order";
import { message, notification } from "ant-design-vue";
import { debounce } from "lodash";
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmCancel = () => {
  confirmOpen.value = false;
};
const confirmType = ref<"close" | "reverse" | "double">("close");
// 平仓操作
const closeOrderConfirm = async () => {
  await closeFormRef.value?.validateFields();
  confirmType.value = "close";
  confirmOpen.value = true;
};
const orderStore = useOrder();
const closeOrder = async () => {
  const { id, symbol } = props.orderInfo;
  const res = await marketOrdersClose({
    symbol,
    id,
    volume: +closeFormState.volume * 100,
  });
  if (res.data.action_success) {
    notification.success({
      message: "仓位关闭成功",
      description: `${closeFormState.volume}手${symbol}的订单已关闭。`,
    });
    handleCancel();
    confirmCancel();
  } else {
    notification.error({
      message: "仓位关闭失败",
      description: `${res.data.err_text}`,
    });
  }
};
// 双倍持仓
const doubleHoldingsConfirm = debounce(() => {
  confirmType.value = "double";
  confirmOpen.value = true;
}, 200);
import { MarketOrdersDouble } from "api/order/index";
const doubleHoldings = async (reverse?: boolean) => {
  const { symbol, volume, type, id } = props.orderInfo;
  const res = await MarketOrdersDouble({ id });
  if (res.data.action_success) {
    notification.success({
      message: "下单成功",
      description: `${
        type ? "卖出" : "买入"
      }${volume / 100}手${symbol}的订单已提交。`,
    });
    handleCancel();
    confirmCancel();
  } else {
    notification.error({
      message: "下单失败",
    });
  }
};
// 反向持仓
import { marketOrdersReverse } from "api/order/index";
const reversePositionConfirm = debounce(() => {
  confirmType.value = "reverse";
  confirmOpen.value = true;
}, 200);
const reversePosition = async () => {
  const { symbol, volume, type, id } = props.orderInfo;
  const realType = +!type;
  const res = await marketOrdersReverse({ id });
  if (res.data.action_success) {
    notification.success({
      message: "下单成功",
      description: `${
        realType ? "卖出" : "买入"
      }${volume / 100}手${symbol}的订单已提交。`,
    });
    handleCancel();
    confirmCancel();
  } else {
    notification.error({
      message: "下单失败",
    });
  }
};
const okCancel = debounce(async () => {
  try {
    confirmLoading.value = true;
    switch (confirmType.value) {
      case "close":
        await closeOrder();
        break;
      case "reverse":
        await reversePosition();
        break;
      case "double":
        await doubleHoldings();
        break;
      default:
        break;
    }
    confirmLoading.value = false;
  } catch (error) {
    confirmLoading.value = false;
  }
}, 200);

// 修改止盈止损
import { editopenningOrders, reqEditOpeningOrders } from "api/order/index";
const modifyLoading = ref(false);
const modify = debounce(async () => {
  await stopFormRef.value?.validateFields();
  const { stopLoss, stopProfit } = stopFormState;
  if (stopLoss === "" && stopProfit === "") {
    return;
  }
  const { id, symbol } = props.orderInfo;
  const updata: reqEditOpeningOrders = { symbol, id };
  if (stopProfit !== "") {
    updata.tp = +stopProfit;
  }
  if (stopLoss !== "") {
    updata.sl = +stopLoss;
  }
  modifyLoading.value = true;
  const res = await editopenningOrders(updata);
  modifyLoading.value = false;
  if (res.data.action_success) {
    message.success("修改成功");
    handleCancel();
    orderStore.refreshOrderArea = true;
  } else {
    message.error(res.data.err_text || "修改失败");
  }
}, 200);
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";
:deep(.ant-modal-content) {
  padding: 0;
  border-radius: 8px;
}
.title {
  width: 100%;
  height: 56px;
  span {
    margin-left: 32px;
    margin-top: 24px;
    display: inline-block;
    font-weight: 500;
    font-size: 18px;
  }
}
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 384px;
  margin: auto;
  &_top {
    box-sizing: border-box;
    width: 100%;
    min-height: 340px;
    border: 1px solid;
    @include border_color("border");
    border-radius: 8px;
  }
  .stopForm {
    margin-top: 24px;
  }
  .closeForm {
    padding: 15px 24px 0 24px;
  }
}
.btn {
  margin-right: 40px;
  margin-bottom: 24px;
}
.iconbtn {
  width: 40px !important;
  height: 40px;
  border-radius: 4px;
}
.closeBtn {
  height: 40px;
  border-radius: 4px;
  font-size: 14px;
}
</style>

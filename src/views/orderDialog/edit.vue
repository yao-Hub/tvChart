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
      <div class="container">
        <div class="container_top">
          <el-form
            ref="closeFormRef"
            :model="closeFormState"
            class="closeForm"
            label-position="top"
            :rules="closeRules"
          >
            <el-form-item prop="symbol" label="交易品种">
              <el-input disabled :value="props.orderInfo.symbol"></el-input>
            </el-form-item>
            <el-form-item prop="transactionType" label="订单类型">
              <el-input
                disabled
                :value="$t(`order.${transactionType}`)"
              ></el-input>
            </el-form-item>
            <el-form-item prop="volume" label="平仓量">
              <div style="display: flex; width: 100%; gap: 16px">
                <StepNumInput
                  :step="step"
                  v-model:value="closeFormState.volume"
                ></StepNumInput>
                <el-tooltip content="反向持仓" placement="top-start">
                  <el-button
                    :icon="Back"
                    @click="handleConfirm('reverse', closeFormRef)"
                  />
                </el-tooltip>
                <el-tooltip content="双倍持仓" placement="top-start">
                  <el-button @click="handleConfirm('double', closeFormRef)">
                    <i class="iconfont icon-icon_2times"></i>
                  </el-button>
                </el-tooltip>
              </div>
            </el-form-item>
            <el-form-item>
              <el-col :span="15">
                <div style="display: flex; gap: 16px; width: 100%">
                  <span class="sellWord" style="width: 50%"
                    >卖价: {{ props.quote.bid }}</span
                  >
                  <span class="buyWord" style="width: 50%"
                    >买价: {{ props.quote.ask }}</span
                  >
                </div>
              </el-col>
              <el-col :span="7">
                <el-button
                  type="primary"
                  class="closeBtn"
                  @click="handleConfirm('close', closeFormRef)"
                  >按市价平仓</el-button
                >
              </el-col>
            </el-form-item>
          </el-form>
        </div>
        <el-form ref="stopFormRef" :model="stopFormState" class="stopForm">
          <el-row :gutter="24">
            <el-col :span="12">
              <StopLossProfit
                type="stopLoss"
                v-model:price="stopFormState.stopLoss"
                :symbolInfo="symbolInfo"
                :quote="props.quote"
                :orderType="combinationType"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
              ></StopLossProfit>
            </el-col>
            <el-col :span="12">
              <StopLossProfit
                type="stopProfit"
                v-model:price="stopFormState.stopProfit"
                :symbolInfo="symbolInfo"
                :quote="props.quote"
                :orderType="combinationType"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
              ></StopLossProfit>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button
          type="primary"
          class="btn"
          :loading="modifyLoading"
          :disabled="!stopFormState.stopLoss && !stopFormState.stopProfit"
          @click="modify"
          >确认修改</el-button
        >
      </template>
    </el-dialog>

    <el-dialog :width="464" v-model="confirmOpen" align-center :z-index="14">
      <template #header>
        <span v-if="confirmType === 'close'">平仓确认</span>
        <span v-if="confirmType === 'reverse'">反向持仓</span>
        <span v-if="confirmType === 'double'">确定对当前持仓加倍吗</span>
      </template>
      <el-row :gutter="24" style="gap: 16px; flex-wrap: wrap; margin-top: 24px">
        <el-col :span="9">订单ID：{{ props.orderInfo.id }}</el-col>
        <el-col :span="9">交易品种：{{ props.orderInfo.symbol }}</el-col>
        <el-col :span="9"
          >订单类型：{{
            $t(
              `order.${
                confirmType === "reverse" ? reverseType : transactionType
              }`
            )
          }}</el-col
        >
        <el-col :span="9">交易量：{{ closeFormState.volume }}</el-col>
      </el-row>
      <template #footer>
        <el-button @click="confirmCancel">取消</el-button>
        <el-button type="primary" @click="okCancel" :loading="confirmLoading"
          >确认</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue";
import { resOrders } from "api/order/index";
import { Quote } from "#/chart/index";
import { Back } from "@element-plus/icons-vue";
interface Props {
  visible: boolean;
  orderInfo: resOrders;
  quote: Quote;
}
const props = defineProps<Props>();
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
import type { FormInstance, FormRules } from "element-plus";
interface CloseFormState {
  volume: string | number;
}
const closeFormRef = ref<FormInstance>();
const closeFormState = reactive<CloseFormState>({
  volume: "",
});
const validateVolume = (rule: any, value: any, callback: any) => {
  if (value === "") {
    return callback(new Error("请输入手数"));
  } else if (+value > props.orderInfo.volume / 100 || +value <= 0) {
    return callback(new Error("请输入合适范围的手数"));
  } else {
    callback();
  }
};
const closeRules = reactive<FormRules<typeof closeFormState>>({
  volume: [{ validator: validateVolume, trigger: "blur" }],
});

// 止盈止损表单
const stopFormState = reactive({
  stopLoss: "",
  stopProfit: "",
});
const stopFormRef = ref<FormInstance>();
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
  return transactionType.value === "sell" ? "buy" : "sell";
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
    await nextTick();
    if (val && closeFormRef.value && stopFormRef.value) {
      closeFormRef.value.resetFields();
      stopFormRef.value.resetFields();
      setTimeout(() => {
        closeFormState.volume = String(props.orderInfo.volume / 100);
        stopFormState.stopLoss = props.orderInfo.sl_price.toString();
        stopFormState.stopProfit = props.orderInfo.tp_price.toString();
      });
    }
  }
);

import { marketOrdersClose } from "api/order/index";
import { useOrder } from "@/store/modules/order";
import { ElNotification, ElMessage } from "element-plus";
import { debounce } from "lodash";
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmCancel = () => {
  confirmOpen.value = false;
};
type ConfirmType = "close" | "reverse" | "double";
const confirmType = ref<ConfirmType>("close");
const handleConfirm = debounce(
  (type: ConfirmType, formEl: FormInstance | undefined) => {
    if (!formEl) return;
    formEl.validate((valid) => {
      if (valid) {
        confirmType.value = type;
        confirmOpen.value = true;
      }
    });
  },
  20
);

// 平仓操作
const orderStore = useOrder();
const closeOrder = async () => {
  const { id, symbol } = props.orderInfo;
  const res = await marketOrdersClose({
    symbol,
    id,
    volume: +closeFormState.volume * 100,
  });
  if (res.data.action_success) {
    ElNotification({
      title: "仓位关闭成功",
      type: "success",
      message: `${closeFormState.volume}手${symbol}的订单已关闭。`,
    });
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
      title: "仓位关闭失败",
      message: `${closeFormState.volume}手${symbol}的订单已关闭。`,
    });
  }
};

// 双倍持仓
import { MarketOrdersDouble } from "api/order/index";
const doubleHoldings = async (reverse?: boolean) => {
  const { symbol, volume, type, id } = props.orderInfo;
  const res = await MarketOrdersDouble({ id });
  if (res.data.action_success) {
    ElNotification({
      title: "下单成功",
      type: "success",
      message: `${type ? "卖出" : "买入"}${
        volume / 100
      }手${symbol}的订单已提交。`,
    });
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
      message: "下单失败",
    });
  }
};
// 反向持仓
import { marketOrdersReverse } from "api/order/index";
const reversePosition = async () => {
  const { symbol, volume, type, id } = props.orderInfo;
  const realType = +!type;
  const res = await marketOrdersReverse({ id });
  if (res.data.action_success) {
    ElNotification.success({
      title: "下单成功",
      message: `${realType ? "卖出" : "买入"}${
        volume / 100
      }手${symbol}的订单已提交。`,
      type: "success",
    });
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
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
}, 20);

// 修改止盈止损
import { editopenningOrders, reqEditOpeningOrders } from "api/order/index";
const modifyLoading = ref(false);
const modify = debounce(async () => {
  const { stopLoss, stopProfit } = stopFormState;
  try {
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
    if (res.data.action_success) {
      ElMessage.success("修改成功");
      handleCancel();
      orderStore.refreshOrderArea = true;
    } else {
      ElMessage.error(res.data.err_text || "修改失败");
    }
  } finally {
    modifyLoading.value = false;
  }
}, 20);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.dialog_header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
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
  font-size: var(--font-size);
  width: 88px;
}
</style>

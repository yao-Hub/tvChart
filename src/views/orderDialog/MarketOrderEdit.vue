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
      <div class="container">
        <div class="container_top">
          <el-form
            ref="closeFormRef"
            :model="closeFormState"
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
                <img
                  class="opearBtn"
                  src="@/assets/icons/icon_18.png"
                  title="反向持仓"
                  @click="handleConfirm('reverse', closeFormRef)"
                />
                <img
                  class="opearBtn"
                  src="@/assets/icons/icon_19.png"
                  title="双倍持仓"
                  @click="handleConfirm('double', closeFormRef)"
                />
              </div>
            </el-form-item>
            <el-col :span="24">
              <Spread
                :quote="props.quote"
                :digits="symbolInfo?.digits"
              ></Spread>
            </el-col>
            <el-col :span="24">
              <el-button
                style="width: 100%; margin-top: 8px"
                type="primary"
                @click="handleConfirm('close', closeFormRef)"
                >按市价平仓</el-button
              >
            </el-col>
            <el-col :span="24" v-if="closeFormState.volume">
              <div class="profit" :class="[profitClass]">
                预计毛利：{{ getProfit() }}
              </div>
            </el-col>
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
                orderType="price"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
                :priceOrderType="transactionType"
              ></StopLossProfit>
            </el-col>
            <el-col :span="12">
              <StopLossProfit
                type="stopProfit"
                v-model:price="stopFormState.stopProfit"
                :symbolInfo="symbolInfo"
                :quote="props.quote"
                orderType="price"
                :orderPrice="props.orderInfo.order_price"
                :volume="props.orderInfo.volume / 100"
                :priceOrderType="transactionType"
              ></StopLossProfit>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-button
          type="primary"
          style="width: 100%"
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
import { IQuote } from "#/chart/index";

import Spread from "./components/spread.vue";

interface Props {
  orderInfo: resOrders;
  quote: IQuote;
}
const props = defineProps<Props>();
const emit = defineEmits();

const modal = defineModel("visible", { type: Boolean, default: false });
const handleCancel = () => {
  modal.value = false;
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
    return callback(new Error(`需<=${props.orderInfo.volume / 100}`));
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
import { getTradingDirection } from "utils/order/index";
// buy or sell
const transactionType = computed(() => {
  return getTradingDirection(props.orderInfo.type);
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
  () => modal.value,
  async (val) => {
    await nextTick();
    if (val && closeFormRef.value && stopFormRef.value) {
      closeFormRef.value.resetFields();
      stopFormRef.value.resetFields();
      closeFormState.volume = (props.orderInfo.volume / 100).toString();
      stopFormState.stopLoss = props.orderInfo.sl_price.toString();
      stopFormState.stopProfit = props.orderInfo.tp_price.toString();
    }
  }
);

import { marketOrdersClose } from "api/order/index";
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
import { marketOrdersDouble } from "api/order/index";
const doubleHoldings = async (reverse?: boolean) => {
  const { symbol, volume, type, id } = props.orderInfo;
  const res = await marketOrdersDouble({ id });
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
    } else {
      ElMessage.error(res.data.err_text || "修改失败");
    }
  } finally {
    modifyLoading.value = false;
  }
}, 20);

// 获取盈亏
const profitClass = ref("");
const getProfit = () => {
  try {
    const volume = +closeFormState.volume;
    let result: string | number = "";
    const type = getTradingDirection(props.orderInfo.type);
    // 持仓多单时，close_price = 现价卖价
    // 持仓空单时，close_price = 现价买价
    const closePrice = type === "buy" ? props.quote.bid : props.quote.ask;
    const { contract_size, storage, fee, open_price } = props.orderInfo;
    // 建仓合约价值 = open_price X contract_size X volume / 100
    const buildingPrice = (open_price * contract_size * volume) / 100;
    // 平仓合约价值 = close_price X contract_size X volume / 100
    const closingPrice = (closePrice * contract_size * volume) / 100;
    // buy时 : profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
    // sell时 : profit = 建仓合约价值 - 平仓合约价值 + 手续费 + 过夜费
    const direction =
      type === "buy"
        ? closingPrice - buildingPrice
        : buildingPrice - closingPrice;
    result = (direction + (storage || 0) + (fee || 0)).toFixed(2);
    profitClass.value = +result > 0 ? "up" : "down";
    return result;
  } catch (error) {
    return "";
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.up {
  @include background_color("upHover");
}
.down {
  @include background_color("downHover");
}
.dialog_header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: 31px;
  &_top {
    width: 100%;
    border-bottom: 1px solid;
    @include border_color("border");
    padding-bottom: 24px;
  }
  .stopForm {
    margin-top: 24px;
  }
}
.opearBtn {
  cursor: pointer;
  width: var(--size);
  height: var(--size);
}
.profit {
  padding: 5px 0;
  text-align: center;
  margin-top: 4px;
}
</style>

<template>
  <div>
    <el-dialog
      class="order_dialog scrollList"
      v-if="model"
      align-center
      width="464"
      v-model="model"
      :zIndex="dialogStore.zIndex"
      @close="handleCancel"
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
            <el-form-item prop="symbol" :label="t('table.symbol')">
              <el-input disabled :value="props.orderInfo.symbol"></el-input>
            </el-form-item>
            <el-form-item prop="transactionType" :label="t('dialog.orderType')">
              <el-input
                disabled
                :value="$t(`order.${transactionType}`)"
              ></el-input>
            </el-form-item>
            <el-form-item prop="volume" :label="t('dialog.closeVolume')">
              <div style="display: flex; width: 100%; gap: 16px">
                <StepNumInput
                  :step="step"
                  v-model:value="closeFormState.volume"
                ></StepNumInput>
                <BaseImg
                  class="opearBtn"
                  iconName="icon_18"
                  :title="t('dialog.reversePosition')"
                  @click="handleConfirm('reverse', closeFormRef)"
                />
                <BaseImg
                  class="opearBtn"
                  iconName="icon_19"
                  :title="t('dialog.doublePosition')"
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
                >{{ t("dialog.closeByPrice") }}</el-button
              >
            </el-col>
            <el-col :span="24" v-if="closeFormState.volume">
              <div class="profit" :class="[profitClass]">
                {{ t("order.expectedGrossProfit") }}: {{ getProfit() }}
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
                :orderType="`${props.orderInfo.type ? 'sell' : 'buy'}Price`"
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
                :orderType="`${props.orderInfo.type ? 'sell' : 'buy'}Price`"
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
          style="width: 100%"
          :loading="modifyLoading"
          :disabled="!stopFormState.stopLoss && !stopFormState.stopProfit"
          @click="modify"
          >{{ $t("tip.confirm", { type: t("modify") }) }}</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-if="confirmOpen"
      :width="464"
      v-model="confirmOpen"
      align-center
      :zIndex="dialogStore.zIndex"
    >
      <template #header>
        <span v-if="confirmType === 'close'">{{
          $t("tip.confirm", { type: t("dialog.closePosition") })
        }}</span>
        <span v-if="confirmType === 'reverse'">{{
          $t("dialog.reversePosition")
        }}</span>
        <span v-if="confirmType === 'double'">{{
          $t("dialog.confirmDouble")
        }}</span>
      </template>
      <el-row :gutter="24" style="gap: 16px; flex-wrap: wrap; margin-top: 24px">
        <el-col :span="9"
          >{{ $t("dialog.order") }}ID：{{ props.orderInfo.id }}</el-col
        >
        <el-col :span="9"
          >{{ $t("table.symbol") }}：{{ props.orderInfo.symbol }}</el-col
        >
        <el-col :span="9"
          >{{ $t("dialog.orderType") }}：{{
            $t(
              `order.${
                confirmType === "reverse" ? reverseType : transactionType
              }`
            )
          }}</el-col
        >
        <el-col :span="9"
          >{{ $t("dialog.tradingVolume") }}：{{ closeFormState.volume }}</el-col
        >
      </el-row>
      <template #footer>
        <el-button @click="confirmCancel">{{ $t("cancel") }}</el-button>
        <el-button type="primary" @click="okCancel" :loading="confirmLoading">{{
          $t("ok")
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { IQuote } from "#/chart/index";
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { resOrders } from "api/order/index";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Spread from "./components/spread.vue";

const dialogStore = useDialog();
const orderStore = useOrder();

const { t } = useI18n();

interface Props {
  orderInfo: resOrders;
  quote: IQuote;
}
const props = defineProps<Props>();
const emit = defineEmits();

const model = defineModel("visible", { type: Boolean, default: false });

/** 当前品种 */
import { useSymbols } from "@/store/modules/symbols";
const symbolsStore = useSymbols();
const symbolInfo = computed(() => {
  return symbolsStore.symbols.find((e) => e.symbol === props.orderInfo.symbol);
});

// 平仓表单
import type { FormInstance, FormRules } from "element-plus";
import { getTradingDirection } from "utils/order/index";
import StopLossProfit from "./components/StopLossProfit.vue";
interface CloseFormState {
  volume: string | number;
}
const closeFormRef = ref<FormInstance>();
const closeFormState = reactive<CloseFormState>({
  volume: "",
});
const validateVolume = (rule: any, value: any, callback: any) => {
  if (value === "") {
    return callback(new Error(t("tip.volumeRequired")));
  } else if (+value > props.orderInfo.volume / 100 || +value <= 0) {
    return callback(
      new Error(`${t("tip.need")} <= ${props.orderInfo.volume / 100}`)
    );
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
  () => model.value,
  (val) => {
    if (val) {
      closeFormState.volume = (props.orderInfo.volume / 100).toString();
      stopFormState.stopLoss = props.orderInfo.sl_price.toString();
      stopFormState.stopProfit = props.orderInfo.tp_price.toString();
    }
  }
);

import { marketOrdersClose } from "api/order/index";
import { ElMessage, ElNotification } from "element-plus";
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
        dialogStore.incrementZIndex();
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
      title: t("dialog.positionClosedSuccessfully"),
      type: "success",
      message: t("dialog.orderClose", {
        volume: closeFormState.volume,
        symbol,
      }),
    });
    orderStore.getData("order_closed");
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
      title: t("dialog.positionClosingFailed"),
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
      title: t("tip.succeed", { type: t("dialog.createOrder") }),
      type: "success",
      message: t("dialog.createOrderSucceed", {
        type: t(`order.${type ? "sell" : "buy"}`),
        volume,
        symbol,
      }),
    });
    orderStore.getData("order_opened");
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
      message: t("tip.failed", { type: t("dialog.createOrder") }),
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
      message: t("dialog.createOrderSucceed", {
        type: t(`order.${realType ? "sell" : "buy"}`),
        volume,
        symbol,
      }),
      type: "success",
    });
    orderStore.getData("order_closed");
    handleCancel();
    confirmCancel();
  } else {
    ElNotification.error({
      message: t("tip.failed", { type: t("dialog.createOrder") }),
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
      orderStore.getData("order_modified");
      ElMessage.success(t("tip.succeed", { type: t("modify") }));
      handleCancel();
    } else {
      ElMessage.error(
        res.data.err_text || t("tip.failed", { type: t("modify") })
      );
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

const handleCancel = () => {
  closeFormRef.value?.resetFields();
  stopFormRef.value?.resetFields();
  model.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.up {
  @include background_color("upLight");
}
.down {
  @include background_color("downLight");
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

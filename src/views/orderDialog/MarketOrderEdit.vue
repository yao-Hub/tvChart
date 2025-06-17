<template>
  <div>
    <el-dialog
      class="order_dialog scrollList"
      v-if="model"
      align-center
      width="464"
      v-model="model"
      :show-close="false"
      :zIndex="dialogStore.zIndex"
      draggable
      @close="handleCancel"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog_title">
          <span :id="titleId" :class="titleClass"
            >ID: {{ props.orderInfo.id }}</span
          >
          <el-icon class="closeBtn" @click="close"><Close /></el-icon>
        </div>
      </template>
      <div class="order_dialog-container">
        <div class="order_dialog-container_top">
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
                :value="t(`order.${transactionType}`)"
              ></el-input>
            </el-form-item>
            <el-form-item prop="volume" :label="t('table.volume')">
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
                :quote="quote"
                :digits="symbolInfo?.digits"
                :symbol="symbolInfo?.symbol"
              ></Spread>
            </el-col>
            <el-col :span="24">
              <el-tooltip :disabled="!tradeDisabled" placement="top">
                <template #content>
                  <span>{{ t("tip.marketClosed") }}</span>
                </template>
                <el-button
                  style="width: 100%; margin-top: 8px"
                  type="primary"
                  :disabled="tradeDisabled"
                  @click="handleConfirm('close', closeFormRef)"
                  >{{ t("dialog.closeByPrice") }}</el-button
                >
              </el-tooltip>
            </el-col>
            <el-col :span="24" v-if="closeFormState.volume">
              <div class="profitBox" :class="[profitClass]">
                <el-text
                  >{{ t("order.expectedGrossProfit") }}:
                  {{ nowProfit }}</el-text
                >
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
                :quote="quote"
                :orderType="`${props.orderInfo.type ? 'sell' : 'buy'}Price`"
                :orderPrice="props.orderInfo.open_price"
                :volume="+props.orderInfo.volume / 100"
                :fee="props.orderInfo.fee"
                :storage="props.orderInfo.storage"
                :preCurrency="props.orderInfo.pre_currency"
              ></StopLossProfit>
            </el-col>
            <el-col :span="12">
              <StopLossProfit
                type="stopProfit"
                v-model:price="stopFormState.stopProfit"
                :symbolInfo="symbolInfo"
                :quote="quote"
                :orderType="`${props.orderInfo.type ? 'sell' : 'buy'}Price`"
                :orderPrice="props.orderInfo.open_price"
                :volume="+props.orderInfo.volume / 100"
                :fee="props.orderInfo.fee"
                :storage="props.orderInfo.storage"
                :preCurrency="props.orderInfo.pre_currency"
              ></StopLossProfit>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <el-tooltip :disabled="!tradeDisabled" placement="top">
          <template #content>
            <span>{{ t("tip.marketClosed") }}</span>
          </template>
          <el-button
            type="primary"
            style="width: 100%"
            :loading="modifyLoading"
            :disabled="
              (!stopFormState.stopLoss && !stopFormState.stopProfit) ||
              tradeDisabled
            "
            @click="modify"
            >{{ t("dialog.confirmModify") }}</el-button
          >
        </el-tooltip>
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
          t("tip.confirm", { type: t("dialog.closePosition") })
        }}</span>
        <div v-if="confirmType === 'reverse'" class="reverseTitle">
          <span>{{ t("dialog.reversePosition") }}</span>
          <span class="reverseTitle_tip">{{ t("tip.reversePosition") }}</span>
        </div>
        <span v-if="confirmType === 'double'">{{
          t("dialog.confirmDouble")
        }}</span>
      </template>
      <el-row style="margin-top: 24px">
        <el-col :span="12">
          <el-text type="info">{{ t("dialog.order") }}ID：</el-text>
          <el-text>{{ props.orderInfo.id }}</el-text>
        </el-col>
        <el-col :span="12">
          <el-text type="info">{{ t("table.symbol") }}：</el-text>
          <el-text>{{ props.orderInfo.symbol }}</el-text>
        </el-col>
      </el-row>
      <el-row style="margin: 16px 0 24px 0">
        <el-col :span="12">
          <el-text type="info">{{ t("dialog.orderType") }}：</el-text>
          <el-text>{{
            t(
              `order.${
                confirmType === "reverse" ? reverseType : transactionType
              }`
            )
          }}</el-text>
        </el-col>
        <el-col :span="12">
          <el-text type="info">{{ t("dialog.tradingVolume") }}：</el-text>
          <el-text v-if="confirmType === 'close'">{{
            closeFormState.volume
          }}</el-text>
          <el-text v-else>{{ props.orderInfo.volume / 100 }}</el-text>
        </el-col>
      </el-row>

      <template #footer>
        <el-button @click="confirmCancel">{{ t("cancel") }}</el-button>
        <el-button type="primary" @click="okCancel" :loading="confirmLoading">{{
          t("ok")
        }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";

import { resOrders } from "api/order/index";

import Spread from "./components/spread.vue";

const dialogStore = useDialog();
const orderStore = useOrder();
const quotesStore = useQuotes();

const { t } = useI18n();

interface Props {
  orderInfo: resOrders;
}
const props = defineProps<Props>();
const emit = defineEmits();

const model = defineModel("visible", { type: Boolean, default: false });

const quote = computed(() => {
  const quotes = quotesStore.qoutes;
  const symbol = props.orderInfo.symbol;
  return quotes[symbol] || {};
});

/** 当前商品 */
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

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step / 100 : 1;
});

const tradeDisabled = ref(false);
watch(
  () => model.value,
  async (val) => {
    if (val) {
      const { volume, sl_price, tp_price, symbol } = props.orderInfo;
      closeFormState.volume = (volume / 100).toString();
      stopFormState.stopLoss = sl_price ? String(sl_price) : "";
      stopFormState.stopProfit = tp_price ? String(tp_price) : "";
      tradeDisabled.value = await orderStore.getTradAble(symbol);
    }
  }
);

import { debounce, get, isNil } from "lodash";
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmCancel = () => {
  confirmOpen.value = false;
};
type ConfirmType = "close" | "reverse" | "double";
const confirmType = ref<ConfirmType>("close");
const handleConfirm = debounce(
  (type: ConfirmType, formEl: FormInstance | undefined) => {
    if (tradeDisabled.value) {
      ElMessage.warning(t("tip.marketClosed"));
      return;
    }
    if (!formEl) return;
    formEl.validate((valid) => {
      if (valid) {
        dialogStore.incrementZIndex();
        confirmType.value = type;
        confirmOpen.value = true;
      }
    });
  },
  200
);

// 平仓操作
const closeOrder = debounce(
  async () => {
    const { id, symbol, type } = props.orderInfo;
    const updata = {
      symbol,
      id,
      volume: +closeFormState.volume,
      type,
    };
    await orderStore.delMarketOrder(updata);
    orderStore.getData("order_closed");
    handleCancel();
    confirmCancel();
  },
  200,
  { leading: true }
);

import { marketOrdersDouble, marketOrdersReverse } from "api/order/index";
import { ElMessage, ElNotification } from "element-plus";
import { logIndexedDB } from "utils/IndexedDB/logDatabase";
import { useUser } from "@/store/modules/user";
import dayjs from "dayjs";

const addMarket = async (state: "reverse" | "double") => {
  let errmsg = "";
  let logStr = "";

  const { symbol, volume, type, id } = props.orderInfo;
  const direction = {
    reverse: type ? "buy" : "sell",
    double: type ? "sell" : "buy",
  }[state];

  logStr = `${direction} ${volume / 100} ${symbol} `;

  let res;
  const actionMap = {
    reverse: marketOrdersReverse,
    double: marketOrdersDouble,
  };
  if (actionMap[state]) {
    try {
      res = await actionMap[state]({ id });
      if (res && res.data.action_success) {
        ElNotification({
          title: t("tip.succeed", { type: t("dialog.createOrder") }),
          type: "success",
          message: t("dialog.createOrderSucceed", {
            type: t(`order.${direction}`),
            volume: volume / 100,
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
    } catch (error: any) {
      errmsg =
        get(error, "errmsg") || get(error, "message") || JSON.stringify(error);
    } finally {
      const login = useUser().account.login;
      const server = useUser().account.server;
      const logErr = errmsg ? `error ${errmsg}` : "";
      logStr = `${login}: #${id} ${state} market ${logErr} ${logStr}`;
      const logData = {
        logType: errmsg ? "error" : "info",
        logName: `${state} market`,
        detail: logStr,
        id: new Date().getTime(),
        origin: "trades",
        time: dayjs().format("YYYY.MM.DD HH:mm:ss.SSS"),
        login,
        server,
        day: dayjs().format("YYYY.MM.DD"),
      };
      await logIndexedDB.addData(logData);
      orderStore.getData("log");
    }
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
        await addMarket("reverse");
        break;
      case "double":
        await addMarket("double");
        break;
      default:
        break;
    }
  } finally {
    confirmLoading.value = false;
  }
}, 200);

// 修改止盈止损
import { reqEditOpeningOrders } from "api/order/index";
const modifyLoading = ref(false);
const modify = debounce(
  () => {
    const { stopLoss, stopProfit } = stopFormState;
    if (!stopLoss && !stopProfit) {
      return;
    }
    modifyLoading.value = true;
    const { id, symbol } = props.orderInfo;
    const updata: reqEditOpeningOrders = { symbol, id };
    if (stopProfit !== "") {
      updata.tp = +stopProfit;
    }
    if (stopLoss !== "") {
      updata.sl = +stopLoss;
    }
    orderStore
      .modifyMarketOrder({ ...updata }, props.orderInfo)
      .then(() => handleCancel())
      .finally(() => (modifyLoading.value = false));
  },
  200,
  { leading: true }
);

// 获取盈亏
const profitClass = ref("");
const nowProfit = computed(() => {
  try {
    const volume = closeFormState.volume;
    if (volume === "") {
      return "-";
    }
    const { storage, fee, open_price, type, symbol, pre_currency, profit } =
      props.orderInfo;

    const symbolInfo = useSymbols().symbols.find((e) => e.symbol === symbol);
    if (!symbolInfo) {
      profitClass.value = +profit > 0 ? "up" : "down";
      return profit;
    }
    const direction = getTradingDirection(type);
    const closePrice =
      direction === "buy" ? get(quote.value, "bid") : get(quote.value, "ask");
    if (!isNil(closePrice)) {
      const profit = orderStore.getProfit(
        {
          symbol,
          closePrice: closePrice,
          buildPrice: open_price,
          volume: +volume,
          fee,
          storage,
          pre_currency,
        },
        direction
      );
      profitClass.value = +profit > 0 ? "up" : "down";
      return profit;
    }
    return "-";
  } catch (error) {
    return "-";
  }
});

const handleCancel = () => {
  closeFormRef.value?.resetFields();
  stopFormRef.value?.resetFields();
  model.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

:deep(.el-input__wrapper) {
  height: var(--base-height);
}

:deep(.el-select__wrapper) {
  height: var(--base-height);
}

:deep(.el-date-editor.el-input, .el-date-editor.el-input__wrapper) {
  height: var(--base-height);
}

.up {
  @include background_color("upLight");
}
.down {
  @include background_color("downLight");
}

.order_dialog-container {
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
  width: var(--component-size);
  height: var(--component-size);
}
.profitBox {
  padding: 5px 0;
  text-align: center;
  margin-top: 4px;
}
.reverseTitle {
  display: flex;
  flex-direction: column;
  gap: 7px;
  &_tip {
    line-height: 18px;
    @include font_color("word-gray");
  }
}
</style>

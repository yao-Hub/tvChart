<template>
  <div>
    <el-dialog
      class="order_dialog scrollList"
      v-if="dialogStore.visibles.marketOrderEditVisible"
      v-model="dialogStore.visibles.marketOrderEditVisible"
      destroy-on-close
      align-center
      width="464"
      :show-close="false"
      :zIndex="dialogStore.zIndex"
      draggable
      @close="handleCancel"
    >
      <template #header="{ close, titleId, titleClass }">
        <div class="dialog_title">
          <span :id="titleId" :class="titleClass"
            >ID: {{ orderStore.state.editOrderInfo!.id }}</span
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
              <el-input
                disabled
                :value="orderStore.state.editOrderInfo!.symbol"
              ></el-input>
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
                :orderType="`${orderStore.state.editOrderInfo!.type ? 'sell' : 'buy'}Price`"
                :orderPrice="orderStore.state.editOrderInfo!.open_price"
                :volume="+orderStore.state.editOrderInfo!.volume / 100"
                :fee="orderStore.state.editOrderInfo!.fee"
                :storage="orderStore.state.editOrderInfo!.storage"
                :preCurrency="orderStore.state.editOrderInfo!.pre_currency"
              ></StopLossProfit>
            </el-col>
            <el-col :span="12">
              <StopLossProfit
                type="stopProfit"
                v-model:price="stopFormState.stopProfit"
                :symbolInfo="symbolInfo"
                :quote="quote"
                :orderType="`${orderStore.state.editOrderInfo!.type ? 'sell' : 'buy'}Price`"
                :orderPrice="orderStore.state.editOrderInfo!.open_price"
                :volume="+orderStore.state.editOrderInfo!.volume / 100"
                :fee="orderStore.state.editOrderInfo!.fee"
                :storage="orderStore.state.editOrderInfo!.storage"
                :preCurrency="orderStore.state.editOrderInfo!.pre_currency"
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
            :disabled="tradeDisabled"
            @click="modify"
            >{{ t("dialog.confirmModify") }}</el-button
          >
        </el-tooltip>
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

import Spread from "./components/spread.vue";

const dialogStore = useDialog();
const orderStore = useOrder();
const quotesStore = useQuotes();

const { t } = useI18n();

const emit = defineEmits();

const quote = computed(() => {
  const quotes = quotesStore.qoutes;
  const symbol = orderStore.state.editOrderInfo!.symbol;
  return quotes[symbol] || {};
});

/** 当前商品 */
import { useSymbols } from "@/store/modules/symbols";
const symbolsStore = useSymbols();
const symbolInfo = computed(() => {
  return symbolsStore.symbols.find(
    (e) => e.symbol === orderStore.state.editOrderInfo!.symbol
  );
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
  } else if (
    +value > orderStore.state.editOrderInfo!.volume / 100 ||
    +value <= 0
  ) {
    return callback(
      new Error(
        `${t("tip.need")} <= ${orderStore.state.editOrderInfo!.volume / 100}`
      )
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
  return getTradingDirection(orderStore.state.editOrderInfo!.type);
});

const step = computed(() => {
  return symbolInfo.value ? symbolInfo.value.volume_step / 100 : 1;
});

const tradeDisabled = ref(false);
watch(
  () => dialogStore.visibles.marketOrderEditVisible,
  async (val) => {
    if (val) {
      const { volume, sl_price, tp_price, symbol } =
        orderStore.state.editOrderInfo!;
      closeFormState.volume = (volume / 100).toString();
      stopFormState.stopLoss = sl_price ? String(sl_price) : "";
      stopFormState.stopProfit = tp_price ? String(tp_price) : "";
      tradeDisabled.value = await orderStore.getTradAble(symbol);
    }
  }
);

import { debounce, get, isNil } from "lodash";
import { ElMessage } from "element-plus";
const handleConfirm = debounce((type, formEl: FormInstance | undefined) => {
  if (tradeDisabled.value) {
    ElMessage.warning(t("tip.marketClosed"));
    return;
  }
  if (!formEl) return;
  formEl.validate((valid) => {
    if (valid) {
      orderStore.state.marketConfirmInfo.type = type;
      orderStore.state.marketConfirmInfo.volume = closeFormState.volume;
      dialogStore.openDialog("marketOrderComfirmVisible");
    }
  });
}, 200);

// 修改止盈止损
import { reqEditOpeningOrders } from "api/order/index";
const modifyLoading = ref(false);
const modify = debounce(
  () => {
    const { stopLoss, stopProfit } = stopFormState;
    modifyLoading.value = true;
    const { id, symbol } = orderStore.state.editOrderInfo!;
    const updata: reqEditOpeningOrders = { symbol, id };
    updata.tp = +stopProfit;
    updata.sl = +stopLoss;
    orderStore
      .modifyMarketOrder({ ...updata }, orderStore.state.editOrderInfo!)
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
      orderStore.state.editOrderInfo!;

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
  dialogStore.closeDialog("marketOrderEditVisible");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
@import "./common.scss";

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
</style>

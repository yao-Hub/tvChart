<template>
  <el-dialog
    class="order_dialog scrollList"
    v-if="dialogStore.visibles.PendingOrderEditVisible"
    v-model="dialogStore.visibles.PendingOrderEditVisible"
    align-center
    width="464"
    @close="handleCancel"
    :show-close="false"
    :zIndex="dialogStore.zIndex"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass"
          >ID: {{ orderStore.state.editOrderInfo!.id }}</span
        >
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
    </template>
    <el-form :model="formState" ref="orderFormRef">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item
            prop="symbol"
            :label="t('table.symbol')"
            label-position="top"
          >
            <el-input
              disabled
              :value="orderStore.state.editOrderInfo!.symbol"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            prop="symbol"
            :label="t('dialog.orderType')"
            label-position="top"
          >
            <el-input
              disabled
              :value="getOrderType(orderStore.state.editOrderInfo!.type)"
            ></el-input>
          </el-form-item>
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
                formState.orderType.includes('Stop')
                  ? t('dialog.breakPrice')
                  : t('dialog.limitedPrice')
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
            :orderPrice="formState.orderPrice"
            :formOption="{
              name: 'limitedPrice',
              label: t('dialog.limitedPrice'),
            }"
            :orderType="formState.orderType"
            :symbolInfo="symbolInfo"
          ></BreakLimit>
        </el-col>
        <el-col :span="24">
          <Volume
            disabled
            v-model:volume="formState.volume"
            :symbolInfo="symbolInfo"
            :quote="quote"
            :orderType="formState.orderType"
            :formOption="{ name: 'volume', label: t('table.volume') }"
            :orderPrice="formState.orderPrice"
            :limitedPrice="formState.limitedPrice"
          ></Volume>
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
            :preCurrency="orderStore.state.editOrderInfo!.pre_currency"
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
            :preCurrency="orderStore.state.editOrderInfo!.pre_currency"
          ></StopLossProfit>
        </el-col>
        <el-col
          :span="24"
          v-if="domVisableOption.dueDate.includes(formState.orderType)"
        >
          <Term v-model:term="formState.dueDate"></Term>
        </el-col>
        <el-col :span="24">
          <Spread
            :quote="quote"
            :digits="symbolInfo?.digits"
            :symbol="symbolInfo?.symbol"
          ></Spread>
        </el-col>
        <el-col :span="24">
          <div class="btns">
            <el-tooltip :disabled="!tradeDisabled" placement="top">
              <template #content>
                <span>{{ t("tip.marketClosed") }}</span>
              </template>
              <el-button
                style="flex: 1"
                @click="delOrder"
                :disabled="tradeDisabled"
                :loading="delLoading"
                >{{ t("delete") }}</el-button
              >
            </el-tooltip>
            <el-tooltip :disabled="!tradeDisabled" placement="top">
              <template #content>
                <span>{{ t("tip.marketClosed") }}</span>
              </template>
              <el-button
                style="flex: 1"
                type="primary"
                :disabled="tradeDisabled"
                :loading="editing"
                @click="confirmEdit"
                >{{ t("dialog.confirmModify") }}</el-button
              >
            </el-tooltip>
          </div>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { debounce } from "lodash";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { orderTypeOptions } from "@/constants/common";
import type { FormInstance } from "element-plus";

import BreakLimit from "./components/BreakLimit.vue";
import Price from "./components/Price.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Volume from "./components/Volume.vue";
import Spread from "./components/spread.vue";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useTime } from "@/store/modules/time";

const { t } = useI18n();

const dialogStore = useDialog();
const timeStore = useTime();
const orderStore = useOrder();

const emit = defineEmits();

const handleCancel = () => {
  orderFormRef.value?.resetFields();
  dialogStore.closeDialog("PendingOrderEditVisible");
};

/** 表单处理 */
const orderFormRef = ref<FormInstance>();
interface FormState {
  symbol: string;
  orderType: string;
  volume: string | number;
  stopLoss: string;
  stopProfit: string;
  orderPrice: string;
  dueDate: string | number;
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
  limitedPrice: "",
});
const domVisableOption = {
  orderPrice: [
    "buyLimit",
    "sellLimit",
    "buyStop",
    "sellStop",
    "buyStopLimit",
    "sellStopLimit",
  ],
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

import { useQuotes } from "@/store/modules/quotes";
const quotesStore = useQuotes();
const quote = computed(() => {
  const quotes = quotesStore.qoutes;
  const symbol = orderStore.state.editOrderInfo!.symbol;
  return quotes[symbol] || {};
});

// 重置表单 自动填充
const tradeDisabled = ref(false);
watch(
  () => dialogStore.visibles.PendingOrderEditVisible,
  async (val) => {
    if (val) {
      const {
        type,
        volume,
        sl_price,
        tp_price,
        symbol,
        time_expiration,
        trigger_price,
        order_price,
      } = orderStore.state.editOrderInfo!;

      const timezone = timeStore.settedTimezone;
      const target = orderTypeOptions.find((e) => e.type === type);
      if (target) {
        formState.orderType = target.value;
      }
      formState.symbol = symbol;
      formState.volume = volume / 100;
      formState.stopLoss = sl_price ? String(sl_price) : "";
      formState.stopProfit = tp_price ? String(tp_price) : "";
      formState.dueDate = dayjs(time_expiration).tz(timezone).unix();
      formState.limitedPrice = trigger_price;
      formState.orderPrice = String(order_price);
      tradeDisabled.value = await orderStore.getTradAble(symbol);
    }
  }
);

const getOrderType = (type: number) => {
  const target = orderTypeOptions.find((e) => e.type === type);
  if (target) {
    return target.label;
  }
};

/** 当前商品 */
import { useSymbols } from "@/store/modules/symbols";
const symbolsStore = useSymbols();
const symbolInfo = computed(() => {
  return symbolsStore.symbols.find((e) => e.symbol === formState.symbol);
});

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

import { reqPendingOrdersAdd } from "api/order/index";
const editing = ref(false);
const confirmEdit = debounce(
  async () => {
    editing.value = true;
    const values = await valids();
    if (values) {
      const target = orderTypeOptions.find(
        (e) => e.value === formState.orderType
      );
      const updata: reqPendingOrdersAdd = {
        symbol: formState.symbol,
        type: target!.type,
        volume: +formState.volume,
        order_price: +formState.orderPrice,
        time_expiration: +formState.dueDate,
      };
      if (["buyStopLimit", "sellStopLimit"].includes(formState.orderType)) {
        updata.trigger_price = +formState.limitedPrice;
      }
      if (formState.stopLoss !== "") {
        updata.sl = +formState.stopLoss;
      }
      if (formState.stopProfit !== "") {
        updata.tp = +formState.stopProfit;
      }
      orderStore
        .modifyPendingOrder(
          {
            ...updata,
            id: orderStore.state.editOrderInfo!.id,
          },
          orderStore.state.editOrderInfo!
        )
        .then(() => handleCancel())
        .finally(() => (editing.value = false));
    }
  },
  200,
  { leading: true }
);

import { ElMessageBox } from "element-plus";
const delLoading = ref(false);
const delOrder = debounce(
  () => {
    ElMessageBox.confirm("", t("tip.confirm", { type: t("delete") })).then(
      () => {
        delLoading.value = true;
        orderStore
          .delPendingOrder(orderStore.state.editOrderInfo!)
          .then(() => orderStore.getPendingOrderHistory())
          .finally(() => {
            delLoading.value = false;
            handleCancel();
          });
      }
    );
  },
  200,
  { leading: true }
);
</script>

<style lang="scss"></style>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
@import "./common.scss";

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
.btns {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 8px;
}
</style>

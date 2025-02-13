<template>
  <el-dialog
    v-if="dialogStore.orderDialogVisible"
    :key="freshKey"
    v-model="dialogStore.orderDialogVisible"
    class="order_dialog scrollList"
    width="450"
    :zIndex="dialogStore.zIndex"
    :modal="false"
    :close-on-click-modal="false"
    draggable
    overflow
    align-center
    modal-class="order_dialog_modal"
    @close="handleCancel"
  >
    <template #header>
      <span class="dialog_header">{{ $t("dialog.createOrder") }}</span>
    </template>

    <el-form
      v-show="!priceConfirm"
      :model="formState"
      :rules="rules"
      ref="orderFormRef"
      style="margin-top: 32px"
    >
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item
            prop="symbol"
            :label="t('table.symbol')"
            label-position="top"
          >
            <SymbolSelect v-model="formState.symbol" subSymbol></SymbolSelect>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-radio-group v-model="formState.orderType">
            <el-radio-button :label="t('dialog.marketOrder')" value="price" />
            <el-radio-button
              :label="t('table.pendingOrder')"
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
          <el-form-item
            prop="orderType"
            :label="t('dialog.type')"
            label-position="top"
          >
            <el-select
              v-model="formState.orderType"
              filterable
              :placeholder="t('dialog.orderType')"
              :suffix-icon="SelectSuffixIcon"
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
            v-model:volume="formState.volume"
            :symbolInfo="symbolInfo"
            :quote="quote"
            :formOption="{ name: 'volume', label: t('table.volume') }"
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
          <el-button class="sellBtn" @click="showConfirmModal('sell')">{{
            $t("order.sell")
          }}</el-button>
        </el-col>
        <el-col :span="12" v-if="['', 'price'].includes(formState.orderType)">
          <el-button class="buyBtn" @click="showConfirmModal('buy')">{{
            $t("order.buy")
          }}</el-button>
        </el-col>
        <el-col :span="24" v-if="!['price'].includes(formState.orderType)">
          <el-button
            :class="[
              formState.orderType.includes('sell') ? 'sellBtn' : 'buyBtn',
            ]"
            class="pendingBtn"
            :loading="pendingBtnLoading"
            @click="addPendingOrders"
            >{{ $t("dialog.createOrder") }}</el-button
          >
        </el-col>
      </el-row>
    </el-form>

    <!-- 市价单下单确认 -->
    <div v-show="priceConfirm" class="confirmBox">
      <BaseImg iconName="icon_recognise" class="icon" />
      <el-text class="tip" type="info">{{ $t("dialog.confirmBelow") }}</el-text>
      <div class="infobox">
        <div class="infobox_item">
          <el-text type="info">{{ $t("order.symbol") }}</el-text>
          <el-text>{{ formState.symbol }}</el-text>
        </div>
        <div class="infobox_item">
          <el-text type="info">{{ $t("dialog.type") }}</el-text>
          <el-text>{{ $t(`order.${directionType}`) }}</el-text>
        </div>
        <div class="infobox_item">
          <el-text type="info">{{ $t("table.volume") }}</el-text>
          <el-text>{{ formState.volume }}</el-text>
        </div>
        <div class="infobox_item">
          <el-text type="info">{{ $t("table.tp") }}</el-text>
          <el-text>{{ formState.stopProfit || "--" }}</el-text>
        </div>
        <div class="infobox_item">
          <el-text type="info">{{ $t("table.sl") }}</el-text>
          <el-text>{{ formState.stopLoss || "--" }}</el-text>
        </div>
      </div>
      <div class="btnGroup">
        <el-button class="btn" @click="back">{{ $t("dialog.back") }}</el-button>
        <el-button
          class="btn"
          type="primary"
          :loading="priceBtnLoading"
          @click="createPriceOrder"
          >{{ $t("tip.confirm") }}</el-button
        >
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { cloneDeep, debounce, eq } from "lodash";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { DirectionType, OrderType } from "#/order";

import SelectSuffixIcon from "@/components/SelectSuffixIcon.vue";
import BreakLimit from "./components/BreakLimit.vue";
import Price from "./components/Price.vue";
import Spread from "./components/spread.vue";
import StopLossProfit from "./components/StopLossProfit.vue";
import Term from "./components/Term.vue";
import Volume from "./components/Volume.vue";

import { useChartInit } from "@/store/modules/chartInit";
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useSymbols } from "@/store/modules/symbols";
import { useTime } from "@/store/modules/time";

const { t } = useI18n();

const symbolsStore = useSymbols();
const orderStore = useOrder();
const chartInitStore = useChartInit();
const quotesStore = useQuotes();
const dialogStore = useDialog();
const timeStore = useTime();

/** 表单处理 */
import type { FormInstance, FormRules } from "element-plus";
const orderFormRef = ref<FormInstance>();
interface FormState {
  symbol: string;
  orderType: OrderType;
  volume: string;
  stopLoss: string;
  stopProfit: string;
  orderPrice: string;
  dueDate: string;
  limitedPrice: string;
}
const originState: FormState = {
  symbol: "",
  orderType: "price",
  volume: "",
  stopLoss: "",
  stopProfit: "",
  orderPrice: "",
  dueDate: "",
  limitedPrice: "",
};
const formState = reactive<FormState>(cloneDeep(originState));
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

// 重置表单 自动填充
const initForm = () => {
  const initState = orderStore.state.initOrderState;
  formState.symbol = initState.symbol || chartInitStore.getDefaultSymbol();
  // 快捷交易买入卖出直接弹到确认订单
  if (initState.mode === "confirm") {
    formState.orderType = "price";
    formState.volume = initState.volume;
    showConfirmModal(initState.directionType);
  }
};

const freshKey = ref(0);

// 右键菜单新图表时初始化数据
watch(
  () => [orderStore.state.initOrderState, dialogStore.orderDialogVisible],
  (nowValue, oldValue) => {
    const [nowState, nowVisible] = nowValue;
    const [preState] = oldValue;
    const ifEq = eq(nowState, preState);
    !ifEq && (freshKey.value = +!freshKey.value);
    if (nowVisible) {
      initForm();
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
import dayjs from "dayjs";
const validDate = (rule: any, value: any, callback: any) => {
  const timezone = timeStore.settedTimezone;
  if (!value) {
    return callback(new Error(t("tip.termRequired")));
  }
  const distanceFromNow = dayjs.unix(value).tz(timezone).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return callback(new Error(t("tip.noLessNowTime")));
  }
  callback();
};
const rules: FormRules<typeof formState> = {
  dueDate: [{ required: true, trigger: "change", validator: validDate }],
};

/** 当前商品 */
const symbolInfo = computed(() => {
  return symbolsStore.symbols.find((e) => e.symbol === formState.symbol);
});

/** 当前报价 */
const quote = computed(() => {
  const quotes = quotesStore.qoutes;
  const symbol = formState.symbol;
  return quotes[symbol] || {};
});

// 确认市价单
const priceConfirm = ref(false);
const back = () => {
  priceConfirm.value = false;
};

// 下单验证
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

const directionType = ref("buy"); // 交易方向
const showConfirmModal = debounce(async (type: DirectionType) => {
  const valid = await valids();
  directionType.value = type;
  if (valid) {
    priceConfirm.value = true;
  }
}, 200);

// 市价单下单
import { marketOrdersAdd, ReqOrderAdd } from "api/order/index";
import { ElNotification } from "element-plus";
const priceBtnLoading = ref(false);
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
        title: t("tip.succeed", { type: t("dialog.createOrder") }),
        message: t("dialog.createOrderSucceed", {
          type: t(`order.${directionType.value}`),
          volume: formState.volume,
          symbol: formState.symbol,
        }),
        type: "success",
      });
      orderStore.getData("order_opened");
      back();
      handleCancel();
    } else {
      ElNotification.error({
        title: t("tip.failed", { type: t("dialog.createOrder") }),
        message: `${res.data.err_text}`,
      });
    }
  } finally {
    priceBtnLoading.value = false;
  }
}, 200);

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
      }
      if (formState.stopLoss !== "") {
        updata.sl = +formState.stopLoss;
      }
      if (formState.stopProfit !== "") {
        updata.tp = +formState.stopProfit;
      }
      const res = await pendingOrdersAdd(updata);
      if (res.data.action_success) {
        orderStore.getData("pending_order_opened");
        ElMessage.success(t("tip.succeed", { type: t("dialog.createOrder") }));
        handleCancel();
      } else {
        ElMessage.error(
          `${t("tip.failed", { type: t("dialog.createOrder") })}：${
            res.data.err_text
          }`
        );
      }
    }
  } finally {
    pendingBtnLoading.value = false;
  }
}, 200);

/** 弹窗处理 */
const handleCancel = () => {
  Object.assign(formState, originState);
  orderStore.state.initOrderState = { symbol: "" };
  back();
  dialogStore.closeDialog("orderDialogVisible");
};
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
:deep(.el-select__wrapper) {
  height: var(--height);
}
:deep(.el-input__wrapper) {
  height: var(--height);
}
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
  @include background_color("border");
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
.confirmBox {
  display: flex;
  flex-direction: column;
  align-items: center;
  .icon {
    width: 64px;
    height: 64px;
    margin-top: 48px;
  }
  .title {
    font-size: 18px;
    margin-top: 8px;
  }
  .tip {
    margin-top: 8px;
  }
  .infobox {
    margin-top: 24px;
    width: 100%;
    padding: 16px;
    box-sizing: border-box;
    @include background_color("background");
    display: grid;
    grid-template-columns: 50% 50%;
    grid-row-gap: 8px;
    gap: 8px;
    &_item span {
      display: inline-block;
      min-width: 70px;
    }
  }
  .btnGroup {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin-top: 105px;
    gap: 16px;
    .btn {
      flex: 1;
      height: var(--height);
    }
  }
}
</style>

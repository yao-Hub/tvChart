<template>
  <el-dialog
    class="order_dialog scrollList"
    v-if="model"
    align-center
    width="464"
    v-model="model"
    @close="handleCancel"
    :zIndex="dialogStore.zIndex"
  >
    <template #header>
      <span class="dialog_header">ID: {{ props.orderInfo.id }}</span>
    </template>
    <el-form :model="formState" :rules="rules" ref="orderFormRef">
      <el-row :gutter="24">
        <el-col :span="24">
          <el-form-item
            prop="symbol"
            :label="t('table.symbol')"
            label-position="top"
          >
            <el-input disabled :value="props.orderInfo.symbol"></el-input>
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
              :value="getOrderType(props.orderInfo.type)"
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
            :formOption="{ name: 'volume', label: t('dialog.closeVolume') }"
            :orderPrice="formState.orderPrice"
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
        <el-col :span="24">
          <div class="btns">
            <el-button style="flex: 1" @click="delPendingOrder">{{
              $t("delete")
            }}</el-button>
            <el-button
              style="flex: 1"
              type="primary"
              :loading="editing"
              @click="confirmEdit"
              >{{ $t("tip.confirm", { type: t("modify") }) }}</el-button
            >
          </div>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { debounce, findKey } from "lodash";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ORDERMAP } from "@/constants/common";
import { resPendingOrders } from "api/order/index";
import type { FormInstance, FormRules } from "element-plus";
import { getOrderType } from "utils/order/index";

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
interface Props {
  orderInfo: resPendingOrders;
}
const props = defineProps<Props>();
const emit = defineEmits();
const model = defineModel("visible", { type: Boolean, default: false });
const handleCancel = () => {
  orderFormRef.value?.resetFields();
  model.value = false;
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
  const symbol = props.orderInfo.symbol;
  return quotes[symbol] || {};
});

// 重置表单 自动填充
watch(
  () => model.value,
  (val) => {
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
      } = props.orderInfo;

      const timezone = timeStore.settedTimezone;
      const orderType = findKey(ORDERMAP, (o) => o === type);
      if (orderType) {
        formState.orderType = orderType;
      }
      formState.symbol = symbol;
      formState.volume = volume / 100;
      formState.stopLoss = sl_price ? String(sl_price) : "";
      formState.stopProfit = tp_price ? String(tp_price) : "";
      formState.dueDate = dayjs(time_expiration).tz(timezone).unix();
      formState.limitedPrice = trigger_price;
      formState.orderPrice = String(order_price);
    }
  }
);

// 期限规则
const validDate = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error(t("tip.termRequired")));
  }
  const timezone = timeStore.settedTimezone;
  const distanceFromNow = dayjs.unix(value).tz(timezone).fromNow();
  if (distanceFromNow.includes("ago") || distanceFromNow.includes("前")) {
    return callback(new Error(t("tip.noLessNowTime")));
  }
  callback();
};
const rules: FormRules<typeof formState> = {
  orderType: [{ required: true, trigger: "change" }],
  volume: [{ required: true, trigger: "change" }],
  dueDate: [{ required: true, trigger: "change", validator: validDate }],
  limitedPrice: [{ required: true, trigger: "change" }],
};

/** 当前品种 */
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

import { editPendingOrders, reqPendingOrdersAdd } from "api/order/index";
import { ElMessage } from "element-plus";
const editing = ref(false);
const confirmEdit = debounce(async () => {
  try {
    editing.value = true;
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
      const res = await editPendingOrders({
        ...updata,
        id: props.orderInfo.id,
      });
      if (res.data.action_success) {
        orderStore.getData("pending_order_modified");
        ElMessage.success(t("tip.succeed", { type: t("modify") }));
        handleCancel();
      } else {
        ElMessage.error(
          `${t("tip.failed", { type: t("modify") })}：${res.data.err_text}`
        );
      }
    }
  } finally {
    editing.value = false;
  }
}, 200);

import { delPendingOrders } from "api/order/index";
import { ElMessageBox } from "element-plus";

const delPendingOrder = () => {
  ElMessageBox.confirm("", t("tip.confirm", { type: t("delete") })).then(
    async () => {
      const res = await delPendingOrders({
        id: props.orderInfo.id,
        symbol: props.orderInfo.symbol,
      });
      if (res.data.action_success) {
        orderStore.getData("pending_order_deleted");
        ElMessage.success(t("dialog.pendingClosingSuccessfully"));
        handleCancel();
        return;
      }
      ElMessage.error(res.data.err_text);
    }
  );
};
</script>

<style lang="scss"></style>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

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
.dialog_header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
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

<template>
  <el-dialog
    v-if="dialogStore.visibles.marketOrderComfirmVisible"
    v-model="dialogStore.visibles.marketOrderComfirmVisible"
    :zIndex="dialogStore.zIndex"
    :width="464"
    align-center
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
        <el-text>{{ orderStore.state.editOrderInfo!.id }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">{{ t("table.symbol") }}：</el-text>
        <el-text>{{ orderStore.state.editOrderInfo!.symbol }}</el-text>
      </el-col>
    </el-row>
    <el-row style="margin: 16px 0 24px 0">
      <el-col :span="12">
        <el-text type="info">{{ t("dialog.orderType") }}：</el-text>
        <el-text>{{
          t(
            `order.${confirmType === "reverse" ? reverseType : transactionType}`
          )
        }}</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">{{ t("dialog.tradingVolume") }}：</el-text>
        <el-text v-if="confirmType === 'close'">{{ volume }}</el-text>
        <el-text v-else>{{
          orderStore.state.editOrderInfo!.volume / 100
        }}</el-text>
      </el-col>
    </el-row>

    <template #footer>
      <el-button @click="confirmCancel">{{ t("cancel") }}</el-button>
      <el-button type="primary" @click="okCancel" :loading="confirmLoading">{{
        t("ok")
      }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { debounce } from "lodash";

import { getTradingDirection } from "@/utils/order";

import { useOrder } from "@/store/modules/order";
import { useDialog } from "@/store/modules/dialog";

const { t } = useI18n();

const dialogStore = useDialog();
const orderStore = useOrder();

const confirmLoading = ref(false);

const confirmType = computed(() => orderStore.state.marketConfirmInfo.type);
const volume = computed(() => orderStore.state.marketConfirmInfo.volume);

const transactionType = computed(() => {
  return getTradingDirection(orderStore.state.editOrderInfo!.type);
});
const reverseType = computed(() => {
  return transactionType.value === "sell" ? "buy" : "sell";
});

// 平仓操作
const closeOrder = debounce(
  async () => {
    const { id, symbol, type } = orderStore.state.editOrderInfo!;
    const updata = {
      symbol,
      id,
      volume: +volume.value!,
      type,
    };
    await orderStore.delMarketOrder(updata);
    orderStore.getData("order_closed");
    confirmCancel();
  },
  200,
  { leading: true }
);

const okCancel = debounce(async () => {
  try {
    confirmLoading.value = true;
    switch (confirmType.value) {
      case "close":
        await closeOrder();
        break;
      case "reverse":
      case "double":
        await orderStore.addMarket(confirmType.value);
        confirmCancel();
        break;
      default:
        break;
    }
  } finally {
    confirmLoading.value = false;
  }
}, 200);

const confirmCancel = () => {
  dialogStore.closeDialog("marketOrderComfirmVisible");
  dialogStore.closeDialog("marketOrderEditVisible");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

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

<template>
  <div class="transaction">
    <div class="transaction_left">
      <el-icon><WalletFilled /></el-icon>
      <span>{{ $t("QuickTransactions") }}</span>
    </div>
    <el-switch v-model="orderStore.ifOne" :before-change="beforeChange" size="small" />
  </div>
</template>

<script setup lang="ts">
import { WalletFilled } from "@element-plus/icons-vue";
import { useOrder } from "@/store/modules/order";
import { useDialog } from "@/store/modules/dialog";

const orderStore = useOrder();
const dialogStore = useDialog();

const beforeChange = () => {
  if (!orderStore.ifOne) {
    dialogStore.disclaimers = true;
    return false;
  }
  orderStore.setOneTrans(false);
  return true;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  height: 32px;

  &_left {
    display: flex;
    gap: 5px;
    align-items: center;
  }
}
</style>

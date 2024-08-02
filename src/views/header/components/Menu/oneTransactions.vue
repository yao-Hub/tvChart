<template>
  <div class="transaction">
    <div class="transaction_left">
      <DollarCircleFilled />
      <span>{{ $t("QuickTransactions") }}</span>
    </div>
    <a-switch
      :checked="orderStore.ifOne"
      size="small"
      @click="handleClick"
    />
  </div>
</template>

<script setup lang="ts">
import { DollarCircleFilled } from "@ant-design/icons-vue";
import { useOrder } from "@/store/modules/order";
import { useDialog } from "@/store/modules/dialog";

const orderStore = useOrder();
const dialogStore = useDialog();

const emit = defineEmits(["switchClick"]);

const handleClick = (checked: boolean) => {
  emit("switchClick");
  if (checked) {
    dialogStore.disclaimers = true;
    return;
  }
  orderStore.setOneTrans(false);
};


</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;

  &_left {
    display: flex;
    gap: 5px;
  }
}
</style>

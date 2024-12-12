<template>
  <div class="oneTransactions">
    <div class="oneTransactions_left">
      <img class="logo" src="@/assets/icons/icon_9.svg" />
      <span>{{ $t("QuickTransactions") }}</span>
    </div>
    <el-switch v-model="switchVal" :before-change="beforeChange" />
  </div>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { ref, watchEffect } from "vue";

const orderStore = useOrder();
const dialogStore = useDialog();

const switchVal = ref(false);

watchEffect(() => {
  switchVal.value = !!orderStore.ifOne;
});

const emit = defineEmits(["closeDropdown"]);

const beforeChange = () => {
  emit("closeDropdown");
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

.oneTransactions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;
  height: 100%;

  &_left {
    display: flex;
    gap: 5px;
    align-items: center;
  }
}
</style>

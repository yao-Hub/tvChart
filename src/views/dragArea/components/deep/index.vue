<template>
  <div class="deep">
    <el-text type="info" style="align-self: unset">{{
      $t("marketDepth")
    }}</el-text>
    <div class="container" v-if="depths.length">
      <div class="box">
        <div class="item" v-for="item in depths">
          <span class="pre-value">{{ item.ask_size }}</span>
          <span class="last-value">{{ item.ask }}</span>
          <div
            class="ask"
            :style="{ width: getWidth(item.ask_size, 'ask') }"
          ></div>
        </div>
      </div>

      <div class="box">
        <div class="item" v-for="item in depths">
          <span class="pre-value">{{ item.bid }}</span>
          <span class="last-value">{{ item.bid_size }}</span>
          <div
            class="bid"
            :style="{ width: getWidth(item.bid_size, 'bid') }"
          ></div>
        </div>
      </div>
    </div>
    <el-empty v-if="!depths.length"></el-empty>
  </div>
</template>

<script setup lang="ts">
import { useSocket } from "@/store/modules/socket";
import { IDepth } from "@/types/common";
import { maxBy } from "lodash";
import { computed, onMounted } from "vue";

const socketStore = useSocket();

interface Props {
  symbol: string;
}
const props = defineProps<Props>();

const depths = defineModel<IDepth[]>("depths", { default: [] });

const maxBidSize = computed(() => {
  return maxBy(depths.value, "bid_size")?.bid_size;
});
const maxAskSize = computed(() => {
  return maxBy(depths.value, "ask_size")?.ask_size;
});

const getWidth = (value: number, type: string) => {
  const max = type === "bid" ? maxBidSize.value : maxAskSize.value;
  if (max) {
    return `${(value / max) * 100}%`;
  }
  return "0";
};

onMounted(() => {
  socketStore.subQuoteDepth((symbol, quotes) => {
    if (symbol === props.symbol) {
      depths.value = quotes;
    }
  });
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.deep {
  @include background-color("tabActive");
  margin: 0 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 4px;
}
.container {
  flex: 1;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.box {
  @include background_color("background");
  width: 50%;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 8px 8px 16px 8px;
  gap: 16px;
}
.item {
  height: 18px;
  line-height: 18px;
  width: 100%;
  position: relative;
  @include font_color("word");
}
.pre-value {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 2;
}
.last-value {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 2;
}
.ask {
  position: absolute;
  right: 0;
  bottom: -8px;
  height: 8px;
  border-radius: 4px;
  z-index: 1;
  @include background_color("up");
  transition: width 1s ease-in-out;
}
.bid {
  position: absolute;
  bottom: -8px;
  height: 8px;
  left: 0;
  border-radius: 4px;
  z-index: 1;
  @include background_color("down");
  transition: width 1s ease-in-out;
}
</style>

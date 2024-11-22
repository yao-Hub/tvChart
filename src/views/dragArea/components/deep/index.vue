<template>
  <div class="deep">
    <span class="title">市场深度</span>
    <div class="container" v-if="quotes.length">
      <div class="box">
        <div class="item" v-for="item in quotes">
          <span class="pre-value">{{ item.ask_size }}</span>
          <span class="last-value">{{ item.ask }}</span>
          <div
            class="ask"
            :style="{ width: getWidth(item.ask_size, 'ask') }"
          ></div>
        </div>
      </div>

      <div class="box">
        <div class="item" v-for="item in quotes">
          <span class="pre-value">{{ item.bid }}</span>
          <span class="last-value">{{ item.bid_size }}</span>
          <div
            class="bid"
            :style="{ width: getWidth(item.bid_size, 'bid') }"
          ></div>
        </div>
      </div>
    </div>
    <el-empty v-if="!quotes.length"></el-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { maxBy } from "lodash";
import { useSocket } from "@/store/modules/socket";
const socketStore = useSocket();

interface Props {
  symbol: string;
}
const props = defineProps<Props>();

const quotes = computed(() => {
  return socketStore.depthMap[props.symbol] || [];
});

const maxBidSize = computed(() => {
  return maxBy(quotes.value, "bid_size")?.bid_size;
});
const maxAskSize = computed(() => {
  return maxBy(quotes.value, "ask_size")?.ask_size;
});

const getWidth = (value: number, type: string) => {
  const max = type === "bid" ? maxBidSize.value : maxAskSize.value;
  if (max) {
    return `${(value / max) * 100}%`;
  }
  return "0";
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.deep {
  background-color: rgb(244, 244, 244);
  margin: 0 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 4px;
}
.title {
  font-weight: bold;
}
.container {
  flex: 1;
  padding-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.box {
  @include background_color("background-component");
  width: 50%;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
}
.item {
  height: 18px;
  line-height: 18px;
  width: 100%;
  position: relative;
  color: #000;
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
  top: 0;
  height: 100%;
  border-radius: 2px;
  z-index: 1;
  @include background_color("up");
  transition: width 1s ease-in-out;
}
.bid {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 2px;
  z-index: 1;
  @include background_color("down");
  transition: width 1s ease-in-out;
}
</style>

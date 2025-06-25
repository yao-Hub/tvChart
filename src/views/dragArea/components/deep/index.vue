<template>
  <div class="deep">
    <el-text type="info" style="align-self: unset">{{
      t("marketDepth")
    }}</el-text>
    <div class="deep-container" v-if="depths.length">
      <div class="box">
        <div class="item" v-for="item in depths">
          <span class="pre-value">{{ item.bid_size }}</span>
          <span class="last-value">{{ formatPrice(item.bid) }}</span>
          <div class="bid" :style="{ width: item.bidWidth }"></div>
        </div>
      </div>
      <div class="box">
        <div class="item" v-for="item in depths">
          <span class="pre-value">{{ formatPrice(item.ask) }}</span>
          <span class="last-value">{{ item.ask_size }}</span>
          <div class="ask" :style="{ width: item.askWidth }"></div>
        </div>
      </div>
    </div>
    <el-empty v-if="!depths.length" :image-size="80">
      <template #image>
        <BaseImg iconName="icon_empty"></BaseImg>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { useSocket } from "@/store/modules/socket";
import { useSymbols } from "@/store/modules/symbols";
import { IDepth } from "@/types/common";
import { round } from "@/utils/common";
import { maxBy } from "lodash";
import { onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const symbolsStore = useSymbols();

const socketStore = useSocket();

interface Props {
  symbol: string;
}
const props = defineProps<Props>();

const depths = defineModel<IDepth[]>("depths", { default: [] });

const formatPrice = (price: number) => {
  const info = symbolsStore.symbols.find((e) => e.symbol === props.symbol);
  if (info) {
    return round(price, info.digits);
  }
  return price;
};

onMounted(() => {
  socketStore.emitQuoteDepth([props.symbol]);
  socketStore.subQuoteDepth((symbol, quotes) => {
    if (symbol === props.symbol) {
      const maxBidSize = maxBy(quotes, "bid_size")!.bid_size;
      const maxAskSize = maxBy(quotes, "ask_size")!.ask_size;
      const formatQuotes = quotes.map((item) => {
        const askWidth = `${Math.floor((item.ask_size / maxAskSize) * 100)}%`;
        const bidWidth = `${Math.floor((item.bid_size / maxBidSize) * 100)}%`;
        return {
          ...item,
          askWidth,
          bidWidth,
        };
      });
      depths.value = formatQuotes;
    }
  });
});

onUnmounted(() => {
  socketStore.unSubQuoteDepth([props.symbol]);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.deep {
  @include background-color("background-component");
  margin: 0 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 4px;
}
.deep-container {
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
}
.last-value {
  position: absolute;
  right: 0;
  top: 0;
}
.ask {
  position: absolute;
  bottom: -8px;
  height: 8px;
  left: 0;
  border-radius: 4px;
  @include background_color("down");
  transition: width 1s ease-in-out;
}
.bid {
  position: absolute;
  right: 0;
  bottom: -8px;
  height: 8px;
  border-radius: 4px;
  @include background_color("up");
  transition: width 1s ease-in-out;
}
</style>

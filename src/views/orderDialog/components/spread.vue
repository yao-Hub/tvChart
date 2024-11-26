<template>
  <div class="spread">
    <span class="buyWord">{{ quote?.ask }}</span>
    <div class="spread_point">点差{{ spread }}</div>
    <span class="sellWord">{{ quote?.bid }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Decimal from "decimal.js";
import { Quote } from "#/chart/index";
interface Props {
  quote?: Quote;
  digits?: number;
}
const props = defineProps<Props>();

const spread = computed(() => {
  const ask = props.quote?.ask;
  const bid = props.quote?.bid;
  const digits = props.digits;
  if (ask && bid && digits) {
    const dask = new Decimal(ask);
    const dbid = new Decimal(bid);
    return dask.minus(dbid).abs().times(new Decimal(10).pow(digits));
  }
  return "-";
});
</script>
<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.spread_point {
  @include font_color("word-gray");
  border-bottom: 1px solid;
  @include border_color("word-gray");
  width: 60px;
  text-align: center;
  position: relative;
  padding-bottom: 3px;
  &::before {
    content: "";
    display: block;
    width: 1px;
    height: 4px;
    position: absolute;
    left: 0;
    bottom: 0;
    @include background_color("word-gray");
    transform: rotate(45deg) translateY(1px) translateX(1px);
  }
  &::after {
    content: "";
    display: block;
    width: 1px;
    height: 4px;
    position: absolute;
    right: 0;
    bottom: 0;
    @include background_color("word-gray");
    transform: rotate(-45deg) translateY(1px) translateX(-1px);
  }
}
.spread {
  display: flex;
  align-items: center;
  height: 32px;
  justify-content: center;
  gap: 28px;
}
span {
  font-size: 18px;
}
</style>

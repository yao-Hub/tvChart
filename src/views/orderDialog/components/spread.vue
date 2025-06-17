<template>
  <div class="spread">
    <span :class="[getClass('bid')]">{{
      quote?.bid?.toFixed(props.digits ?? 2)
    }}</span>
    <div class="spread_point">
      <span class="title">{{ t("order.spread") }} {{ spread }}</span>
      <BaseImg class="icon" iconName="icon_arrow"></BaseImg>
    </div>
    <span :class="[getClass('ask')]">{{
      quote?.ask?.toFixed(props.digits ?? 2)
    }}</span>
  </div>
</template>

<script setup lang="ts">
import { IQuote } from "@/types/chart";
import Decimal from "decimal.js";
import { computed } from "vue";

import { useQuotes } from "@/store/modules/quotes";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

interface Props {
  quote?: IQuote;
  digits?: number;
  symbol?: string;
}

const props = defineProps<Props>();
const getClass = (type: "ask" | "bid") => {
  const classes = useQuotes().quotesClass;
  if (props.symbol) {
    if (classes[props.symbol]) {
      return classes[props.symbol][type];
    }
  }
  return "";
};

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
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: flex-end;
  margin-bottom: 4px;
  .title {
    font-size: var(--tip-size);
    @include font_color("word-gray");
    line-height: 4px;
  }
  .icon {
    width: 60px;
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

<template>
  <el-scrollbar class="scrollbar">
    <div class="lists">
      <div
        v-for="item in props.data"
        :class="['lists_item', item.topSort ? 'topSort' : 'noTopSort']"
        @contextmenu="handleContextmenu(item, $event)"
      >
        <div class="top">
          <span>{{ item.symbol }}</span>
          <div :class="[getVariInfo(item.symbol, 'class')]">
            {{ getVariInfo(item.symbol, "numerator") }} ({{
              getVariInfo(item.symbol, "value")
            }})
          </div>
          <span>{{ getTime(item.symbol) }}</span>
        </div>
        <div class="mid">
          <el-tooltip
            :content="`${t('quickTrade.clickSell')}(${t('quickTrade.title')})`"
            placement="top"
            :show-arrow="false"
            :offset="1"
          >
            <div
              :class="['mid_btn', 'left', getClass(item, 'bid')]"
              @click="addOrder(1, item.symbol)"
            >
              <span>{{ t("quickTrade.sell") }}</span>
              <span class="price">{{ getPrice(item.symbol, "bid") }}</span>
            </div>
          </el-tooltip>
          <el-tooltip
            :content="`${t('quickTrade.clickBuy')}(${t('quickTrade.title')})`"
            placement="top"
            :show-arrow="false"
            :offset="1"
          >
            <div
              :class="['mid_btn', 'right', getClass(item, 'ask')]"
              @click="addOrder(0, item.symbol)"
            >
              <span>{{ t("quickTrade.buy") }}</span>
              <span class="price">{{ getPrice(item.symbol, "ask") }}</span>
            </div>
          </el-tooltip>

          <div class="inputBox">
            <el-input
              class="input"
              v-model="volumeMap[item.symbol]"
              :input-style="{
                textAlign: 'center',
              }"
              @blur="handleBlur(item.symbol)"
            >
              <template #prefix>
                <BaseImg
                  iconName="caretDown"
                  clearColor
                  @click="handleDown(item.symbol)"
                />
              </template>
              <template #suffix>
                <BaseImg
                  iconName="caretUp"
                  clearColor
                  @click="handleUp(item.symbol)"
                />
              </template>
            </el-input>
          </div>
        </div>
        <div class="down">
          <span>L {{ getLow(item.symbol) }}</span>
          <span>S {{ quotesStore.getSpread(item.symbol) }}</span>
          <span>H {{ getHigh(item.symbol) }}</span>
        </div>
      </div>
    </div>

    <div class="lists_empty" v-if="!props.data.length">
      <EmptyTip @btnClick="emit('emptyBtnClick')"></EmptyTip>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { ISymbolListDataSource } from "@/types/common";
import { ReqOrderAdd } from "api/order/index";

import EmptyTip from "./EmptyTip.vue";

import { useQuotes } from "@/store/modules/quotes";
import { useSymbols } from "@/store/modules/symbols";
import { useSymbolList } from "../useSymbolList";
import { useOrder } from "@/store/modules/order";
import { ElMessage } from "element-plus";
import { debounce } from "lodash";
import { useDialog } from "@/store/modules/dialog";

const { t } = useI18n();
const quotesStore = useQuotes();
const orderStore = useOrder();
const { getTime, getClass, getPrice } = useSymbolList();

const props = defineProps<{
  data: ISymbolListDataSource[];
}>();

const emit = defineEmits(["emptyBtnClick", "rowContextmenu"]);

const handleContextmenu = (row: ISymbolListDataSource, event: MouseEvent) => {
  emit("rowContextmenu", row, null, event);
};

const getLow = (symbol: string) => {
  const quotes = quotesStore.qoutes[symbol];
  return quotes?.low || "-";
};
const getHigh = (symbol: string) => {
  const quotes = quotesStore.qoutes[symbol];
  return quotes?.high || "-";
};
const getStep = (symbol: string) => {
  const target = useSymbols().symbols.find((e) => e.symbol === symbol);
  return target ? target.volume_step / 100 : 0.01;
};

const getVariInfo = (symbol: string, type: "numerator" | "class" | "value") => {
  return quotesStore.getVariation(symbol)[type];
};

const volumeMap = ref<Record<string, string>>({});
const setMinVolume = (symbol: string) => {
  const target = useSymbols().symbols.find((e) => e.symbol === symbol);
  if (!target) return;
  volumeMap.value[symbol] = String(target.volume_step / 100);
};

const getMaxVolume = (symbol: string) => {
  const target = useSymbols().symbols.find((e) => e.symbol === symbol);
  return target ? target.volume_max / 100 : null;
};

watch(
  () => props.data,
  () => {
    props.data.forEach((item) => {
      const inputvolume = volumeMap.value[item.symbol];
      if (!inputvolume) {
        setMinVolume(item.symbol);
      }
    });
  },
  { deep: true, immediate: true }
);
const handleBlur = (symbol: string) => {
  const volume = volumeMap.value[symbol];
  if (volume === "") {
    setMinVolume(symbol);
  }
  const maxVolume = getMaxVolume(symbol);
  if (maxVolume && +volume > maxVolume) {
    volumeMap.value[symbol] = maxVolume.toString();
  }
};

const handleDown = (symbol: string) => {
  const step = getStep(symbol);
  const result = orderStore.volumeSub(volumeMap.value[symbol], step, step);
  volumeMap.value[symbol] = result.toString();
};
const handleUp = (symbol: string) => {
  const step = getStep(symbol);
  const result = orderStore.volumeAdd(volumeMap.value[symbol], step);
  volumeMap.value[symbol] = result.toString();
};

const valid = async (symbol: string) => {
  const ifTrader = orderStore.ifCanTrader(symbol);
  if (!ifTrader) {
    return false;
  }
  const tradAble = await orderStore.getTradAble(symbol);
  if (tradAble) {
    return false;
  }
  const value = volumeMap.value[symbol];
  const regex = /^-?\d+(\.\d+)?$/;

  if (!regex.test(value)) {
    ElMessage.error(t("tip.numberFormatEror"));
    return false;
  }
  return true;
};

const addOrder = debounce(
  async (type: 0 | 1, symbol: string) => {
    if (orderStore.state.ifOne === null) {
      useDialog().openDialog("disclaimersVisible");
      return;
    }
    const v = await valid(symbol);
    if (!v) {
      return;
    }
    if (!orderStore.state.ifOne) {
      orderStore.createOrder({
        symbol,
        mode: "confirm",
        type,
        volume: volumeMap.value[symbol],
      });
      return;
    }
    const updata: ReqOrderAdd = {
      symbol,
      type,
      volume: volumeMap.value[symbol],
    };
    orderStore.addMarketOrder(updata);
  },
  200,
  { leading: true, trailing: false }
);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-input__prefix) {
  color: currentColor;
}
:deep(.el-input__suffix) {
  color: currentColor;
}
span {
  @include font_color("word");
}
.scrollbar {
  @include background_color("background");
}
.lists {
  @include background_color("background");
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .topSort {
    @include background_color("listsTopSort");
    &:hover {
      @include background_color("listsTopSortHover");
    }
  }
  .noTopSort {
    @include background_color("background-dialog");
    &:hover {
      @include background_color("background-hover");
    }
  }

  &_item {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 124px;
    border-radius: 4px;
    padding: 8px;
    box-sizing: border-box;
    gap: 8px;
    .top,
    .down {
      display: flex;
      justify-content: space-between;
    }
    .mid {
      flex: 1;
      min-height: 56px;
      display: flex;
      gap: 2px;
      position: relative;
      background-color: inherit;
      &_btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-items: center;
        padding: 6px 0;
        cursor: pointer;
        @include background_color("listsNormal");
      }
      &_btn:hover {
        @include background_color("listsNormalHover");
      }
      .left {
        border-radius: 4px 0px 0px 4px;
      }
      .right {
        border-radius: 0px 4px 4px 0px;
      }
      .sellWord {
        @include background_color("down");
      }
      .sellWord:hover {
        @include background_color("downHover");
      }
      .sellWord:active {
        @include background_color("downActive");
      }
      .buyWord {
        @include background_color("up");
      }
      .buyWord:hover {
        @include background_color("upHover");
      }
      .buyWord:active {
        @include background_color("upActive");
      }
      .inputBox {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%);
        height: 24px;
        width: 124px;
        padding: 0 2px 2px 2px;
        border-radius: 0 0 4px 4px;
        background-color: inherit;
        .input {
          height: 100%;
        }
      }
      .price {
        font-size: calc(var(--font-size) + 2px);
      }
    }
  }
  &_empty {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.caretDown,
.caretUp {
  cursor: pointer;
}
.caretDown:hover {
  @include font_color("primary");
}
.caretUp:hover {
  @include font_color("primary");
}
</style>

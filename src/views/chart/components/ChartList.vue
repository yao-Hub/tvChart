<template>
  <div class="charts">
    <div class="header">
      <HolderOutlined class="handle"/>
      <a-radio-group v-model:value="state.selectChart" style="display: flex; overflow-x: auto;">
        <a-radio-button value="chart_1">chart_1</a-radio-button>
        <a-radio-button value="chart_2">chart_2</a-radio-button>
        <a-radio-button value="chart_3">chart_3</a-radio-button>
        <a-radio-button value="chart_4">chart_4</a-radio-button>
      </a-radio-group>
    </div>
    <TVChart
      style="height: calc(100% - 32px);"
      chartId="chart_1"
      mainChart
      :loading="props.loading"
      :datafeed="datafeed('chart_1')"
      :symbol="state.symbol"
      :compareSymbols="state.compareSymbols"
      :contextMenu="state.contextMenu"
      @initChart="initChart">
    </TVChart>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { HolderOutlined } from '@ant-design/icons-vue';
import { useChartSub } from '@/store/modules/chartSub';
// import { useUser } from '@/store/modules/user';
import { datafeed } from '../chartConfig';

const chartSubStore = useChartSub();
// const userStore = useUser();
interface Props {
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const state = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  contextMenu: {
    // items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  },
  selectChart: 'chart_1'
});

// widget初始化回调
const initChart = () => {
  // 监听点击报价加号按钮
  // chartSubStore.subscribePlusBtn();
  // chartSubStore.subscribeMouseDown();

  chartSubStore.subscribeKeydown();
  // userStore.initUser();
};
</script>

<style lang="scss" scoped>
.charts {
  display: flex;
  flex-direction: column;
  background: #525252;
  padding: 5px;
  box-sizing: border-box;
  border-radius: 5px;
}
.header {
  display: flex;
  height: 32px;
  align-items: center;
}
</style>
<template>
  <div class="charts">
    <a-radio-group v-model:value="state.selectChart" style="display: flex; overflow-x: auto;margin-left: 20px">
      <a-radio-button value="chart_1">chart_1</a-radio-button>
      <a-radio-button value="chart_2">chart_2</a-radio-button>
      <a-radio-button value="chart_3">chart_3</a-radio-button>
      <a-radio-button value="chart_4">chart_4</a-radio-button>
    </a-radio-group>
    <TVChart
      style="height: calc(100% - 32px);"
      chartId="chart_1"
      mainChart
      :loading="props.loading"
      :datafeed="datafeed('chart_1')"
      :symbol="state.symbol"
      :compareSymbols="compareSymbols"
      :contextMenu="state.contextMenu"
      @initChart="initChart">
    </TVChart>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useChartSub } from '@/store/modules/chartSub';
import { datafeed } from '../chartConfig';
import * as types from '@/types/chart/index';

// import { useUser } from '@/store/modules/user';
// import { useChartAction } from '@/store/modules/chartAction';
// import { useTheme } from '@/store/modules/theme';
// import { datafeed } from './chartConfig';
// import { okLight, okDark } from '@/assets/icons/index';
// const { t } = useI18n();
// const chartActionStore = useChartAction();
// const themeStore = useTheme();
// const userStore = useUser();

const chartSubStore = useChartSub();
interface Props {
  loading?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const state = reactive({
  symbol: 'XAU',
  contextMenu: {
    // items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  },
  selectChart: 'chart_1'
});

const compareSymbols = computed(() => {
  if (chartSubStore.symbols) {
    return chartSubStore.symbols.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      };
    });
  }
});

// widget初始化回调
const initChart = () => {
  // 监听点击报价加号按钮
  // chartSubStore.subscribePlusBtn();
  // chartSubStore.subscribeMouseDown();
  chartSubStore.subscribeKeydown();
};

// const chartWidget = ref();

// 改变主题
// const changeTheme = (theme: string) => {
//   if (chartWidget.value) {
//     chartWidget.value.changeTheme(theme);
//     window.localStorage.setItem('Theme', theme);
//     themeStore.currentTheme = theme;
//   }
// };

// 设置右键菜单
// const setProcessor: library.ContextMenuItemsProcessor = (items, actionsFactory) => {
//   const themeType = chartWidget.value.getTheme().toLowerCase();
//   const themeIcon = themeType === 'dark' ? okDark : okLight;
//   const darkTheme = actionsFactory.createAction({
//     actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
//     label: t('chart.darkTheme'),
//     iconChecked: themeIcon,
//     checkable: true,
//     checked:  themeType === 'dark',
//     onExecute: () => changeTheme('dark')
//   });
//   const lightTheme = actionsFactory.createAction({
//     actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
//     label: t('chart.lightTheme'),
//     iconChecked: themeIcon,
//     checkable: true,
//     checked: themeType === 'light',
//     onExecute: () => changeTheme('light')
//   });
//   const themes = actionsFactory.createAction({
//     actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
//     label: t('chart.ThemeColor'),
//     subItems: [darkTheme, lightTheme]
//   });
//   const result = items.length > 10 ? [themes, ...items] : items;
//   return Promise.resolve(result);
// }
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
</style>
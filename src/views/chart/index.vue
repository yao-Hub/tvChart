<template>
  <div class="chart">
    <a-layout-header>
      <TVChart
        :datafeed="datafeed()"
        :symbol="states.symbol"
        :loading="states.chartLoading"
        :compareSymbols="states.compareSymbols"
        :contextMenu="states.contextMenu"
        @createChart="createChart"
        >
      </TVChart>
    </a-layout-header>
    <a-layout-footer class="footer">
      <OrderArea></OrderArea>
    </a-layout-footer>
  </div>
  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import  * as library from 'public/charting_library';
import * as types from '@/types/chart/index';

import chartInitStore from '@/store/modules/chartInit';
import chartSubStore from '@/store/modules/chartSub';
import chartActionStore from '@/store/modules/chartAction';
import themeStore from '@/store/modules/theme';

import { allSymbols } from 'api/symbols/index';
import { datafeed } from './chartConfig';
import { okLight, okDark } from '@/assets/icons/index';

import TVChart from '@/components/TVChart.vue';
import OrderDialog from './components/OrderDialog.vue';
import FloatMenu from './components/FloatMenu.vue';
import OrderArea from './orderArea/index.vue'

const { t } = useI18n();

const chartInit = chartInitStore();
const chartSub = chartSubStore();
const chartAction = chartActionStore();
const Theme = themeStore();

const states = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  chartLoading: true,
  contextMenu: {
    items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  }
});

const chartWidget = ref();

// 改变主题
const changeTheme = (theme: string) => {
  if (chartWidget.value) {
    chartWidget.value.changeTheme(theme);
    window.localStorage.setItem('Theme', theme);
    Theme.currentTheme = theme;
  }
};

// 设置右键菜单
const setProcessor: library.ContextMenuItemsProcessor = (items, actionsFactory) => {
  const themeType = chartWidget.value.getTheme().toLowerCase();
  const themeIcon = themeType === 'dark' ? okDark : okLight;
  const darkTheme = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.darkTheme'),
    iconChecked: themeIcon,
    checkable: true,
    checked:  themeType === 'dark',
    onExecute: () => changeTheme('dark')
  });
  const lightTheme = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.lightTheme'),
    iconChecked: themeIcon,
    checkable: true,
    checked: themeType === 'light',
    onExecute: () => changeTheme('light')
  });
  const themes = actionsFactory.createAction({
    actionId: 'Chart.CustomActionId' as library.ActionId.ChartCustomActionId,
    label: t('chart.ThemeColor'),
    subItems: [darkTheme, lightTheme]
  });
  const result = items.length > 10 ? [themes, ...items] : items;
  return Promise.resolve(result);
}

// widget初始化回调
const createChart = (widget: library.IChartingLibraryWidget) => {
  chartInit.chartWidget = widget;
  chartWidget.value = widget;

  chartAction.createLocaleBtn();
  // chartAction.createOrderLine();
  chartAction.createAvatar();
  chartAction.createAddOrderBtn();
  
  chartSub.subscribePlusBtn();
  chartSub.subscribeMouseDown();
  chartSub.subscribeKeydown();
};

// 获取所有商品(品种)
const getSymbols = async () => {
  states.chartLoading = true;
  try {
    const res: any = await allSymbols({ server: 'upway-live' });
    chartSub.symbols = res.data;
    states.symbol = res.data[0].symbol;
    states.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      }
    });
    states.chartLoading = false;
  } catch (error) {
    console.log(error)
    states.chartLoading = false;
  }
}
getSymbols();
</script>

<style scoped lang="scss">
.chart {
  display: flex;
  flex-direction: column;
}
</style>

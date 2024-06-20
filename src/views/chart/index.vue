<template>
  <div ref="chart" class="chart" v-if="!chartInitStore.loading">
    <TVChart
      :style="{height: chartHeight + 'px'}"
      :loading="isResizing"
      :datafeed="datafeed()"
      :symbol="states.symbol"
      :compareSymbols="states.compareSymbols"
      :contextMenu="states.contextMenu"
      @createChart="createChart"
      >
    </TVChart>
    <div class="resizeLine" :style="{top: resizeLineTop + 'px'}" @mousedown="resizeLineMousedown"></div>
    <OrderArea :style="{height: orderAreaHeight + 'px'}"></OrderArea>

    <FooterInfo></FooterInfo>
    
  </div>
  <a-spin class="spin" :indicator="indicator" v-else />

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <LoginDialog></LoginDialog>
</template>

<script setup lang="ts">
import { reactive, ref, h, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import  * as library from 'public/charting_library';
import * as types from '@/types/chart/index';

import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { useChartAction } from '@/store/modules/chartAction';
import { useTheme } from '@/store/modules/theme';
import { useUser } from '@/store/modules/user';

import { allSymbols } from 'api/symbols/index';
import { datafeed } from './chartConfig';
import { okLight, okDark } from '@/assets/icons/index';

import TVChart from '@/components/TVChart.vue';
import OrderDialog from '../orderDialog/index.vue';
import FloatMenu from './components/FloatMenu.vue';
import OrderArea from '../orderArea/index.vue';
import LoginDialog from '../loginDialog/index.vue';
import FooterInfo from '../footerInfo/index.vue';

import { LoadingOutlined } from '@ant-design/icons-vue';
const indicator = h(LoadingOutlined, {
  style: {
    fontSize: '50px',
  },
  spin: true,
});

const { t } = useI18n();

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const chartActionStore = useChartAction();
const themeStore = useTheme();
const userStore = useUser();

const states = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  contextMenu: {
    items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  }
});

// 拖拽线移动
const isResizing = ref(false);
const chart = ref();
const chartHeight = ref(window.innerHeight - 204);
const resizeLineTop = ref(window.innerHeight - 202);

window.addEventListener('resize', e => {
  resizeLineTop.value = window.innerHeight - orderAreaHeight.value - 32;
});
const orderAreaHeight = ref(170);
const resizeLineMousedown = () => {
  isResizing.value = true;
  
  function resize(e: MouseEvent) {
    const containerRect = chart.value.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top;

    chartHeight.value = mouseY;
    resizeLineTop.value = mouseY;
    orderAreaHeight.value = containerRect.height - mouseY - 32;
  }
  function stopResize() {
    isResizing.value = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

const chartWidget = ref();

// 改变主题
const changeTheme = (theme: string) => {
  if (chartWidget.value) {
    chartWidget.value.changeTheme(theme);
    window.localStorage.setItem('Theme', theme);
    themeStore.currentTheme = theme;
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
  chartInitStore.chartWidget = widget;
  chartWidget.value = widget;

  // 增加顶部语言切换按钮
  chartActionStore.createLocaleBtn();
  // 增加左上角头像
  chartActionStore.createAvatar();
  // 增加新订单按钮
  chartActionStore.createAddOrderBtn();
  
  // 监听点击报价加号按钮
  chartSubStore.subscribePlusBtn();
  chartSubStore.subscribeMouseDown();
  chartSubStore.subscribeKeydown();

  userStore.initUser();
};

// 获取所有商品(品种)
const getSymbols = async () => {
  chartInitStore.loading = true;
  try {
    const res: any = await allSymbols();
    chartSubStore.symbols = res.data;
    states.symbol = res.data[0].symbol;
    states.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      }
    });
    chartInitStore.loading = false;
  } catch (error) {
    console.log(error)
    chartInitStore.loading = false;
  }
}
getSymbols();
</script>

<style scoped lang="scss">
.chart {
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateY(-50%);
}
.resizeLine {
  background-color: #7cb305;
  height: 2px;
  cursor: row-resize;
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 9;
}
</style>

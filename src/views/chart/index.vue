<template>
  <div ref="chart" class="chart" v-if="!chartInitStore.loading">
    <div class="header">
      <div class="header__left">
        <MenuOutlined />
        <a-button type="link" @click="orderStore.createOrder()">创建订单</a-button>
        <LayoutController></LayoutController>
        <ThunderboltOutlined />
      </div>
      <div class="header__right">
        <span>账号</span>
        <span>9999,9999</span>
        <CaretDownOutlined />
      </div>
    </div>
    <div class="dragArea">
      <ChartList class="gragItem chartList" v-if="layoutStore.chartsVisable"></ChartList>
      <SymbolList class="gragItem symbolList" v-if="layoutStore.symbolsVisable"></SymbolList>
      <OrderArea class="gragItem orderArea" v-if="layoutStore.orderAreaVisable"></OrderArea>
    </div>
    <FooterInfo class="footerInfo"></FooterInfo>
  </div>
  <Spin v-else></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <LoginDialog></LoginDialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from 'vue';
// import { useI18n } from 'vue-i18n';
import {
  MenuOutlined,
  ThunderboltOutlined,
  CaretDownOutlined,
} from '@ant-design/icons-vue';
import Sortable from 'sortablejs';

import * as types from '@/types/chart/index';

import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
// import { useChartAction } from '@/store/modules/chartAction';
// import { useTheme } from '@/store/modules/theme';
import { useLayout } from '@/store/modules/layout';

import { allSymbols } from 'api/symbols/index';
// import { datafeed } from './chartConfig';
// import { okLight, okDark } from '@/assets/icons/index';

import OrderDialog from '../orderDialog/index.vue';
import FloatMenu from './components/FloatMenu.vue';
import OrderArea from '../orderArea/index.vue';
import LoginDialog from '../loginDialog/index.vue';
import FooterInfo from '../footerInfo/index.vue';
import SymbolList from './components/SymbolList.vue';
import ChartList from './components/ChartList.vue';
import LayoutController from './components/LayoutController.vue';

// const { t } = useI18n();

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const userStore = useUser();
const orderStore = useOrder();
const layoutStore = useLayout();

// const chartActionStore = useChartAction();
// const themeStore = useTheme();

const state = reactive({
  symbol: 'XAU',
  compareSymbols: [],
  contextMenu: {
    // items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  },
});

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

// widget初始化回调
// const initChart = () => {
//   // 监听点击报价加号按钮
//   // chartSubStore.subscribePlusBtn();
//   // chartSubStore.subscribeMouseDown();

//   chartSubStore.subscribeKeydown();
//   userStore.initUser();
// };

// 获取所有商品(品种)
const getSymbols = async () => {
  chartInitStore.loading = true;
  try {
    const res: any = await allSymbols();
    chartSubStore.setSymbols(res.data);
    state.symbol = res.data[0].symbol;
    state.compareSymbols = res.data.map((item: types.SessionSymbolInfo) => {
      return {
        symbol: item.symbol,
        title: item.symbol
      };
    });
    chartInitStore.loading = false;
  } catch (error) {
    console.log(error);
    chartInitStore.loading = false;
  }
};
getSymbols();

onMounted(async () => {
  userStore.initUser();
  await nextTick();
  setTimeout(() => {
    const dragArea = document.querySelector('.dragArea') as HTMLElement;
    Sortable.create(dragArea, {
      animation: 100,
      handle: '.handle',
      group: {
        name: 'charts',
      },
    });
  }, 1000);
});
</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';

.divider {
  background-color: #434651;
}

.chart {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: auto;

  .header {
    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 50px;
    border-bottom: 1px solid #434651;
    box-sizing: border-box;

    .header__left {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-evenly;
    }

    .header__right {
      display: flex;
      gap: 8px;
    }
  }

  .dragArea {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .gragItem {
      resize: both;
      overflow: auto;
    }

    .chartList {
      width: 60vw;
      height: 50vh;
    }

    .symbolList {
      width: 35vw;
      height: 40vh;
    }

    .orderArea {
      width: 100vw;
      height: 40vh;
    }
  }

  .footerInfo {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>

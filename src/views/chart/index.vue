<template>
  <div class="chart" v-if="!chartInitStore.loading">
    <div class="header">
      <div class="header__left">
        <MenuOutlined />
        <a-button type="link" @click="orderStore.createOrder()">创建订单</a-button>
        <LayoutController></LayoutController>
        <ThunderboltOutlined />
      </div>
      <div class="header__right">
        <span>账号</span>
        <!-- <span>9999,9999</span> -->
        <CaretDownOutlined />
      </div>
    </div>
    <!-- <div class="container"> -->
      <div class="dragArea">
        <div class="resizeLine" @mousedown="resizeLineMousedown"></div>
        <div class="dragArea_item dragArea_item_top">
          <div class="demo" v-if="layoutStore.chartsVisable">
            <HolderOutlined class="handle" />
            <ChartList class="container_item" name="one" :loading="state.isResizing"></ChartList>
          </div>
          <div class="demo" v-if="layoutStore.symbolsVisable">
            <HolderOutlined class="handle" />
            <SymbolList class="container_item" name="two"></SymbolList>
          </div>
        </div>
        <div class="dragArea_item dragArea_item_down">
          <div class="demo" v-if="layoutStore.orderAreaVisable">
            <HolderOutlined class="handle" />
            <OrderArea class="container_item"></OrderArea>
          </div>
        </div>
      </div>
    <!-- </div> -->
    <FooterInfo class="footerInfo"></FooterInfo>
  </div>
  <Spin v-else></Spin>

  <FloatMenu></FloatMenu>
  <OrderDialog></OrderDialog>
  <LoginDialog></LoginDialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, nextTick } from 'vue';
import Sortable from 'sortablejs';
// import { useI18n } from 'vue-i18n';
import {
  MenuOutlined,
  ThunderboltOutlined,
  CaretDownOutlined,
  HolderOutlined
} from '@ant-design/icons-vue';

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

import LayoutController from './components/LayoutController.vue';
import OrderDialog from '../orderDialog/index.vue';
import FloatMenu from './components/FloatMenu.vue';
import LoginDialog from '../loginDialog/index.vue';
import FooterInfo from '../footerInfo/index.vue';
import OrderArea from '../orderArea/index.vue';
import SymbolList from './components/SymbolList.vue';
import ChartList from './components/ChartList.vue';

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
  isResizing: false,
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

// onMounted(() => {
//   userStore.initUser();
// });

const resizeLineMousedown = () => {
  state.isResizing = true;
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const down = document.querySelector('.dragArea_item_down') as HTMLElement;
  const resizeLine = document.querySelector('.resizeLine') as HTMLElement;
  function resize(e: MouseEvent) {
    const containerRect = top.getBoundingClientRect();
    let mouseY = e.clientY - containerRect.top;
    top.style.height = `${mouseY}px`;
    resizeLine.style.top = `${mouseY}px`;
    down.style.height = `${dragArea.getBoundingClientRect().height - mouseY - 3}px`;
    down.style.top = `${mouseY + 3}px`;
  }
  function stopResize() {
    state.isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

onMounted(async () => {
  userStore.initUser();

  await nextTick();
  setTimeout(() => {
    const dragArea = document.querySelector('.dragArea') as HTMLElement;
    var nestedSortables = [].slice.call(document.querySelectorAll('.dragArea_item'));
    for (var i = 0; i < nestedSortables.length; i++) {
      new Sortable(nestedSortables[i], {
        group: 'nested',
        animation: 150,
        handle: '.handle',
        fallbackOnBody: true,
      });
    }
    const resizeLine = document.querySelector('.resizeLine') as HTMLElement;
    const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
    const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;
    dragArea_item_top.style.height = dragArea.getBoundingClientRect().height / 2 - 1.5 + 'px';
    dragArea_item_down.style.height = dragArea.getBoundingClientRect().height / 2 - 3 + 'px';
    dragArea_item_down.style.top = dragArea.getBoundingClientRect().height / 2 + 3 + 'px';
    resizeLine.style.top = dragArea.getBoundingClientRect().height / 2 + 'px';
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

  // .container {
    
    .dragArea {
      height: calc(100vh - 30px - 50px);
      // overflow: hidden;
      width: 100vw;
      // height: 100%;
      box-sizing: border-box;
      position: relative;

      .dragArea_item {
        display: flex;
        width: 100%;
        gap: 5px;
        box-sizing: border-box;
        position: absolute;
        top: 0;
        left: 0;
        .demo {
          flex: 1;
          width: 0;
          height: 100%;
          box-sizing: border-box;
          position: relative;
          user-select: none;
          overflow: auto;
  
          .container_item {
            height: 100%;
            width: 100%;
          }
  
          .handle {
            position: absolute;
            top: 10px;
            left: 5px;
            z-index: 2;
          }
        }
      }

      .resizeLine {
        height: 3px;
        cursor: row-resize;
        width: 100%;
        position: absolute;
        z-index: 9;

        &:hover {
          background-color: #7cb305;
        }
      }
    }
  // }

  .footerInfo {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
}
</style>

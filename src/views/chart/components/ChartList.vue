<template>
  <div class="charts">
    <a-tabs
      class="charts_tabs"
      v-model:activeKey="state.activeKey"
      type="editable-card"
      @edit="onEdit"
      size="small">
      <a-tab-pane v-for="chart in chartList" :key="chart.id" :tab="chart.symbol" :closable="chart.id !== 'chart_1'">
      </a-tab-pane>
    </a-tabs>
    <div class="charts_container">
      <div
        class="charts_container_item"
        :style="{paddingLeft: chartType === 'multiple' ? '20px' : 0}"
        v-show="(state.activeKey === 'chart_1' && chartType === 'single') || chartType === 'multiple'">
        <HolderOutlined class="handle" v-if="chartType === 'multiple'"/>
        <TVChart
          style="flex: 1; height: 100%;"
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
      <div
        :style="{paddingLeft: chartType === 'multiple' ? '20px' : 0}"
        class="charts_container_item"
        v-for="id in state.chartIds"
        v-show="(state.activeKey === id && chartType === 'single') || chartType === 'multiple'">
        <HolderOutlined class="handle" v-if="chartType === 'multiple'"/>
        <TVChart
          :chartId="id"
          style="flex: 1; height: 100%;"
          :loading="props.loading"
          :datafeed="datafeed(id)"
          :symbol="state.symbol"
          :disabledFeatures="['left_toolbar', 'header_saveload']"
          :compareSymbols="compareSymbols">
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue';
import { useChartInit } from '@/store/modules/chartInit';
import { useChartSub } from '@/store/modules/chartSub';
import { datafeed } from '../chartConfig';
import * as types from '@/types/chart/index';
import { HolderOutlined } from '@ant-design/icons-vue';
import Sortable from 'sortablejs';

// import { IChartingLibraryWidget } from 'public/charting_library/charting_library';

const chartSubStore = useChartSub();
const chartInitStore = useChartInit();

interface Props {
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  loading: false
});

const state = reactive({
  symbol: 'XAU',
  contextMenu: {
    // items_processor: (items: readonly library.IActionVariant[], actionsFactory: library.ActionsFactory) => setProcessor(items, actionsFactory)
  },
  activeKey: 'chart_1',
  chartIds: [] as string[],
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

const chartList = computed(() => {
  return chartInitStore.chartWidgetList;
});

const chartType =  computed(() => {
  return chartInitStore.chartLayoutType;
});

// widget初始化回调
const initChart = () => {
  // 监听点击报价加号按钮
  // chartSubStore.subscribePlusBtn();
  // chartSubStore.subscribeMouseDown();
  chartSubStore.subscribeKeydown();
  const dragArea = document.querySelector('.charts_container');
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 0.65,
    handle: '.handle',
  });
};

function onEdit(targetKey: string, action: string) {
  if (action === 'add') {
    const len = chartInitStore.chartWidgetList.length;
    state.chartIds.push(`chart_${len + 1}`);
  } else {
    const index = state.chartIds.indexOf(targetKey);
    state.chartIds.splice(index, 1);
    chartInitStore.removeChartWidget(targetKey);
  }
};

// import { useUser } from '@/store/modules/user';
// import { useChartAction } from '@/store/modules/chartAction';
// import { useTheme } from '@/store/modules/theme';
// import { datafeed } from './chartConfig';
// import { okLight, okDark } from '@/assets/icons/index';
// const { t } = useI18n();
// const chartActionStore = useChartAction();
// const themeStore = useTheme();
// const userStore = useUser();

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

  &_container {
    display: flex;
    flex-wrap: wrap;
    flex: 1;
    gap: 5px;
    padding-left: 20px;
    box-sizing: border-box;
    &_item {
      flex: 1;
      min-width: 200px;
      position: relative;
      background-color: #141823;
      box-sizing: border-box;

      .handle {
        cursor: grab;
        position: absolute;
        top: 10px;
        left: 5px;
      }
    }
  }

  &_tabs {
    display: flex;
    overflow-x: auto;
    margin-left: 20px;
  }
}
</style>
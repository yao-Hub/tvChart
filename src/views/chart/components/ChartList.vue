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
        :style="{paddingLeft: chartType === 'multiple' ? '20px' : 0}"
        class="charts_container_item"
        v-for="{ id } in chartList"
        :id="id"
        v-show="(state.activeKey === id && chartType === 'single') || chartType === 'multiple'">
        <HolderOutlined class="handle" v-if="chartType === 'multiple'"/>
        <TVChart
          :chartId="id"
          :mainChart="id === 'chart_1'"
          style="flex: 1; height: 100%;"
          :loading="props.loading"
          :datafeed="datafeed(id)"
          :symbol="state.symbol"
          :disabledFeatures="id === 'chart_1' ? [] : ['left_toolbar', 'header_saveload']"
          :compareSymbols="compareSymbols"
          @initChart="initChart">
        </TVChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
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
  if (chartInitStore.chartWidgetList.length > 0) {
    return chartInitStore.chartWidgetList;
  }
  return [{id: 'chart_1'}];
});

const chartType =  computed(() => {
  return chartInitStore.chartLayoutType;
});

// widget初始化回调
const initChart = (id: string) => {
  // 监听点击报价加号按钮
  // chartSubStore.subscribePlusBtn();
  // chartSubStore.subscribeMouseDown();
  chartSubStore.subscribeKeydown();
  chartInitStore.setCacheSymbol();
};

onMounted(() => {
  const dragArea = document.querySelector('.charts_container');
  new Sortable(dragArea, {
    animation: 150,
    swapThreshold: 1,
    handle: '.handle',
    onStart: function() {
      chartInitStore.setCacheSymbol();
    },
    onEnd: function(evt: any) {
      chartInitStore.setChartSymbolWithCache(evt.item.id);
    }
  });
});

function onEdit(targetKey: string, action: string) {
  if (action === 'add') {
    const len = chartInitStore.chartWidgetList.length;
    chartInitStore.chartWidgetList.push({
      id: `chart_${len + 1}`,
    });
    state.activeKey = `chart_${len + 1}`;
  } else {
    chartInitStore.removeChartWidget(targetKey);
    if (targetKey === state.activeKey) {
      const lastChart = chartInitStore.chartWidgetList.slice(-1);
      state.activeKey = lastChart[0].id;
    }
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
<template>
  <a-dropdown-button @click="handleButtonClick" v-model:open="visible" type="primary" size="small">
    <a-tooltip :title="state.toolTip">
      <span class="title">{{ state.title }}</span>
    </a-tooltip>
    <template #overlay>
      <a-menu>
        <a-menu-item key="all">
          <a-checkbox v-model:checked="state.checkAll" @change="onCheckAllChange" :indeterminate="state.indeterminate">全部</a-checkbox>
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="direction">
          <a-checkbox-group v-model:value="state.direction" :options="directionOptions" />
        </a-menu-item>
        <a-menu-divider />
        <a-menu-item key="pol">
          <a-checkbox-group v-model:value="state.pol" :options="polOptions" />
        </a-menu-item>
      </a-menu>
    </template>
    <template #icon>
      <CaretDownOutlined />
    </template>
  </a-dropdown-button>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { CaretDownOutlined } from "@ant-design/icons-vue";
import { throttle } from 'lodash';
import { getTradingDirection } from "utils/order/index";
import { resOrders } from "api/order/index";
import { useOrder } from "@/store/modules/order";
import { TableDataKey } from "#/order";

const orderStore = useOrder();

const visible = ref(false);

interface Props {
  orderType: TableDataKey;
}
const props = defineProps<Props>();

interface State {
  direction: string[];
  pol: string[];
  indeterminate: boolean;
  checkAll: boolean;
  closeOrders: resOrders[];
  title: string;
  toolTip: string;
}

interface Option {
  label: string;
  value: string;
}

const directionOptions: Array<Option> = [
  { label: "买入", value: "buy" },
  { label: "卖出", value: "sell" },
];
const polOptions: Array<Option> = [
  { label: "盈利", value: "profit" },
  { label: "亏损", value: "loss" },
];
const allLen = directionOptions.length + polOptions.length;

const state: State = reactive({
  direction: [],
  pol: [],
  indeterminate: false,
  checkAll: true,
  closeOrders: [],
  title: "",
  toolTip: "",
});

// 初始化全选中
state.direction = directionOptions.map((item) => item.value);
state.pol = polOptions.map((item) => item.value);

const checkList = computed(() => {
  return state.direction.concat(state.pol);
});

const dataSource = computed(() => {
  return orderStore.tableData[props.orderType];
});

watch(
  () => checkList.value,
  (val) => {
    state.indeterminate = !!val.length && val.length < allLen;
    state.checkAll = val.length === allLen;
    if (dataSource.value) {
      getTitleTooltip(dataSource.value);
    }
  }
);

watch(
  () => dataSource.value,
  (val) => {
    if (val) {
      getTitleTooltip(val);
    }
  },
  {
    deep: true,
  }
);

const getTitleTooltip = throttle((data: resOrders[]) => {
  const title_1 = "没有需要关闭的";
  const title_2 = "关闭 全部";
  const toolTip_1 = "创建新订单或更改筛选设置";
  const options = [...directionOptions, ...polOptions];

  if (state.checkAll) {
    state.closeOrders = data;
    state.title = title_2;
    state.toolTip = options.map((item) => item.label).join(",");
    return;
  }
  if (state.direction.length === 0 || state.pol.length === 0) {
    state.closeOrders = [];
    state.title = title_1;
    state.toolTip = toolTip_1;
    return;
  }

  const orders = data.filter(item => {
    const formatDec = getTradingDirection(item.type);
    const rightDec = state.direction.includes(formatDec);
    let profit = false;
    let loss = false;

    if (state.pol.includes('profit')) {
      profit = item.profit > 0;
    }
    if (state.pol.includes('loss')) {
      loss = item.profit < 0;
    }
    return rightDec && (profit || loss);
  });

  state.closeOrders = orders;

  const result = checkList.value.map((item) => {
    return options.find((e) => e.value === item)?.label;
  }).join(",");

  if (orders.length === 0) {
    state.title = title_1;
    state.toolTip = toolTip_1;
  } else {
    state.title = `关闭(${orders.length}) ${result}`;
    state.toolTip = result;
  }
}, 20);
getTitleTooltip([]);

const emit = defineEmits(["closeClick"]);

const onCheckAllChange = (e: any) => {
  const checked = e.target.checked;
  state.direction = checked ? directionOptions.map((item) => item.value) : [];
  state.pol = checked ? polOptions.map((item) => item.value) : [];
};

const handleButtonClick = (e: Event) => {
  emit("closeClick", state.closeOrders, props.orderType);
};
</script>

<style lang="scss" scoped>
.ant-checkbox-group {
  display: flex;
  flex-direction: column;
}
.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100px;
  font-size: 12px;
}
</style>

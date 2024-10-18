<template>
  <el-dropdown
    split-button
    type="primary"
    @click="handleButtonClick"
    :hide-on-click="false"
    size="small"
    trigger="click"
  >
    <el-tooltip :content="state.toolTip" placement="top">
      <span class="title">{{ state.title }}</span>
    </el-tooltip>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>
          <el-checkbox
            v-model="state.checkAll"
            :indeterminate="state.indeterminate"
            @change="onCheckAllChange"
          >
            全部
          </el-checkbox>
        </el-dropdown-item>
        <el-dropdown-item>
          <el-checkbox-group v-model="state.direction">
            <el-checkbox
              v-for="item in directionOptions"
              :label="item.label"
              :value="item.value"
            />
          </el-checkbox-group>
        </el-dropdown-item>
        <el-dropdown-item>
          <el-checkbox-group v-model="state.pol">
            <el-checkbox
              v-for="item in polOptions"
              :label="item.label"
              :value="item.value"
            />
          </el-checkbox-group>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { throttle } from "lodash";
import { getTradingDirection } from "utils/order/index";
import { resOrders } from "api/order/index";
import { useOrder } from "@/store/modules/order";
import { TableDataKey } from "#/order";

const orderStore = useOrder();

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

  const orders = data.filter((item) => {
    const formatDec = getTradingDirection(item.type);
    const rightDec = state.direction.includes(formatDec);
    let profit = false;
    let loss = false;

    if (state.pol.includes("profit")) {
      profit = item.profit > 0;
    }
    if (state.pol.includes("loss")) {
      loss = item.profit < 0;
    }
    return rightDec && (profit || loss);
  });

  state.closeOrders = orders;

  const result = checkList.value
    .map((item) => {
      return options.find((e) => e.value === item)?.label;
    })
    .join(",");

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

const onCheckAllChange = (checked: any) => {
  state.direction = checked ? directionOptions.map((item) => item.value) : [];
  state.pol = checked ? polOptions.map((item) => item.value) : [];
};

const handleButtonClick = (e: Event) => {
  emit("closeClick", state.closeOrders, props.orderType);
};
</script>

<style lang="scss" scoped>
.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100px;
  font-size: var(--font-size);
}
</style>

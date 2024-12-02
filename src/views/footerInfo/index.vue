<template>
  <div class="footerInfo">
    <div class="item">
      <span>{{ $t("order.balance") }}：</span>
      <span>{{ loginInfo?.balance }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.equity") }}：</span>
      <span>{{ userStore.equity }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.Margin") }}：</span>
      <span>{{ userStore.margin }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.marginFree") }}：</span>
      <span>{{ userStore.margin_free }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.marginLevel") }}：</span>
      <span>{{ userStore.margin_level }}</span>
    </div>
    <el-divider direction="vertical" />
    <div class="item">
      <span>{{ $t("order.TotalProfit") }}：</span>
      <span :class="[+profit > 0 ? 'redWord' : 'greenWord']">{{ profit }}</span>
    </div>
    <div class="item_delay">
      <el-dropdown trigger="click" placement="top-start">
        <div
          :class="[+currentDelay > 500 ? 'redWord delay' : 'greenWord delay']"
        >
          <i class="iconfont">&#xe602;</i>
          <span>{{ currentDelay }}ms</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="refreshDelay">
              <div class="operaItem">
                <ReloadOutlined v-if="!delayLoading" />
                <LoadingOutlined v-else />
                <span>{{ $t("refresh") }}</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item
              v-for="node in networkStore.nodeList"
              :key="node.nodeName"
            >
              <div class="delayItem" @click="changeNode(node.nodeName)">
                <div class="left">
                  <img
                    class="selectIcon"
                    src="@/assets/icons/select.svg"
                    v-if="node.nodeName === networkStore.currentNode?.nodeName"
                  />
                  <span class="textEllipsis">
                    {{ node.nodeName }}
                  </span>
                </div>
                <span
                  :class="[
                    +getDelay(node.webWebsocket) > 500
                      ? 'redWord'
                      : 'greenWord',
                  ]"
                  >{{ getDelay(node.webWebsocket) }}ms</span
                >
              </div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ReloadOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { round } from "utils/common/index";

import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useChartInit } from "@/store/modules/chartInit";

const userStore = useUser();
const orderStore = useOrder();
const chartInitStore = useChartInit();

const loginInfo = computed(() => userStore.loginInfo);

// 总盈亏
const profit = computed(() => {
  try {
    if (!loginInfo.value) {
      return "-";
    }
    const currentPosition = orderStore.orderData.marketOrder;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + Number(currentValue.profit);
    }, 0);
    return round(sum || 0, 2);
  } catch (error) {
    return "-";
  }
});

import { ref } from "vue";
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();

const changeNode = (name: string) => {
  const currentNodeName = networkStore.currentNode?.nodeName;
  if (name === currentNodeName) {
    return;
  }
  userStore.changeCurrentAccountOption({
    queryNode: name,
  });
  chartInitStore.refresh();
};

import { get } from "lodash";
import { useSocket } from "@/store/modules/socket";
const socketStore = useSocket();
const currentDelay = computed(() => {
  const currentWsUri = networkStore.currentNode?.webWebsocket || "";
  const delay = get(socketStore.delayMap, currentWsUri) || "-";
  return delay;
});
const getDelay = (uri: string) => {
  const delay = get(socketStore.delayMap, uri) || "-";
  return delay;
};
const delayLoading = ref(false);
const refreshDelay = () => {
  if (delayLoading.value) {
    return;
  }
  socketStore.getDelay((e: any) => {
    delayLoading.value = !e.ending;
  });
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.footerInfo {
  width: 100vw;
  box-sizing: border-box;
  height: 30px;
  @include background_color("background-component");
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  display: flex;
  align-items: center;
  padding: 0 16px;

  .item {
    min-width: 100px;
    overflow: auto;
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    padding: 0 8px;
    & span:first-child {
      @include font_color("word-gray");
    }
    &_delay {
      border: none;
      width: 108px;
      text-align: right;
      margin-left: auto;
    }
  }
}

.delay {
  display: flex;
  cursor: pointer;
  gap: 5px;
  justify-content: center;
  align-items: center;
  height: 30px;
}
.delay:hover {
  @include font_color("primary");
}
.operaItem {
  display: flex;
  gap: 5px;
  align-items: center;
  cursor: pointer;
}
.operaItem:hover {
  @include font_color("primary");
}
.delayItem {
  width: 300px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .left {
    display: flex;
    gap: 5px;
    align-items: center;
  }
}
.redWord {
  color: #ff4a61;
}
.greenWord {
  color: #00c673;
}
</style>

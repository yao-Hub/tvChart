<template>
  <el-dropdown trigger="click" placement="top-start">
    <div :class="[+currentDelay > 500 ? 'redWord delay' : 'greenWord delay']">
      <i class="iconfont">&#xe602;</i>
      <span>{{ currentDelay }}ms</span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <div class="freshItem" @click="refreshDelay">
          <ReloadOutlined v-if="!delayLoading" />
          <LoadingOutlined v-else />
          <span>{{ $t("refresh") }}</span>
        </div>
        <el-dropdown-item
          v-for="node in networkStore.nodeList"
          :key="node.nodeName"
        >
          <div class="delayItem" @click="changeNode(node.nodeName)">
            <div class="left">
              <div class="icon">
                <BaseImg
                  class="selectIcon"
                  iconName="select"
                  v-if="node.nodeName === networkStore.currentNode?.nodeName"
                />
              </div>
              <span class="textEllipsis">
                {{ node.nodeName }}
              </span>
            </div>
            <span
              :class="[
                +getDelay(node.webWebsocket) > 500 ? 'redWord' : 'greenWord',
              ]"
              >{{ getDelay(node.webWebsocket) }}ms</span
            >
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { useChartInit } from "@/store/modules/chartInit";
import { useNetwork } from "@/store/modules/network";
import { useSocket } from "@/store/modules/socket";
import { useUser } from "@/store/modules/user";
import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import { get } from "lodash";
import { computed, ref } from "vue";

const userStore = useUser();
const networkStore = useNetwork();
const chartInitStore = useChartInit();

const changeNode = (name: string) => {
  const currentNodeName = networkStore.currentNode?.nodeName;
  if (name === currentNodeName) {
    return;
  }
  userStore.changeCurrentAccountOption({
    queryNode: name,
  });
  chartInitStore.systemRefresh();
};
const socketStore = useSocket();
const currentDelay = computed(() => {
  const currentWsUri = networkStore.currentNode?.webWebsocket;
  if (currentWsUri) {
    return get(socketStore.delayMap, currentWsUri) || "-";
  }
  return "-";
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
.freshItem {
  display: flex;
  gap: 5px;
  align-items: center;
  cursor: pointer;
  padding: 5px 16px;
  width: fit-content;
}
.freshItem:hover {
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
    .icon {
      display: flex;
      align-items: center;
      margin-right: 8px;
    }
  }
}
.redWord {
  color: var(--color-4);
}
.greenWord {
  color: var(--color-7);
}
</style>

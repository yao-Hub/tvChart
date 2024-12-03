<template>
  <el-dropdown trigger="click" placement="top-start">
    <div :class="[+currentDelay > 500 ? 'redWord delay' : 'greenWord delay']">
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
import { ref, computed } from "vue";
import { ReloadOutlined, LoadingOutlined } from "@ant-design/icons-vue";
import { get } from "lodash";
import { useNetwork } from "@/store/modules/network";
import { useSocket } from "@/store/modules/socket";
import { useChartInit } from "@/store/modules/chartInit";
import { useUser } from "@/store/modules/user";

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
  chartInitStore.refresh();
};
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

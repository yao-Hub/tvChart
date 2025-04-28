<template>
  <el-dropdown trigger="click" placement="top-start" @command="changeNode">
    <div :class="[+currentDelay > 500 ? 'redWord delay' : 'greenWord delay']">
      <i class="iconfont">&#xe602;</i>
      <span>{{ currentDelay }}ms</span>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <div class="freshItem" @click="refreshDelay">
          <ReloadOutlined v-if="!loading" />
          <LoadingOutlined v-else />
          <span>{{ t("refresh") }}</span>
        </div>
        <el-dropdown-item
          v-for="node in networkStore.nodeList"
          :key="node.nodeName"
          :disabled="getDelay(node.webApi) === '-'"
          :command="node.nodeName"
        >
          <div class="delayItem">
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
            <span :class="getDelayClass(node.webApi)"
              >{{ getDelay(node.webApi) }}ms</span
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
import { useUser } from "@/store/modules/user";
import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons-vue";
import { computed, ref } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const userStore = useUser();
const networkStore = useNetwork();
const chartInitStore = useChartInit();

const changeNode = (name: string) => {
  const currentNodeName = networkStore.currentNode?.nodeName;
  if (name === currentNodeName) {
    return;
  }
  const delay = networkStore.nodeList.find(
    (e) => e.nodeName === name
  )?.webApiDelay;
  if (!delay) {
    return;
  }
  userStore.changeCurrentAccountOption({
    queryNode: name,
  });
  chartInitStore.systemRefresh();
};

const currentDelay = computed(() => {
  const webApi = networkStore.currentNode?.webApi;
  if (webApi) {
    const delay = networkStore.nodeList.find(
      (e) => e.webApi === webApi
    )?.webApiDelay;
    return delay || "-";
  }
  return "-";
});
const getDelay = (webApi: string) => {
  const delay = networkStore.nodeList.find(
    (e) => e.webApi === webApi
  )?.webApiDelay;
  return delay || "-";
};
const getDelayClass = (webApi: string) => {
  const delay = getDelay(webApi);
  if (delay === "-") {
    return "redWord";
  }
  if (delay <= 200) {
    return "greenWord";
  }
  if (delay <= 400) {
    return "yellowWord";
  }
  if (delay > 400) {
    return "redWord";
  }
};

const loading = ref(false);
const refreshDelay = async () => {
  if (loading.value) {
    return;
  }
  loading.value = true;
  await networkStore.getNodesDelay();
  loading.value = false;
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
.yellowWord {
  color: var(--color-2);
}
</style>

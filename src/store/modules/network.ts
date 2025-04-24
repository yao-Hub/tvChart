import { defineStore } from "pinia";
import axios from "axios";
import { ElMessage } from "element-plus";
import i18n from "@/language/index";

import {
  queryNode,
  queryTradeLine,
  resQueryNode,
  resQueryTradeLine,
} from "api/account/index";
import { getPort } from "utils/common";

import { useUser } from "./user";
import { orderBy } from "lodash";

interface IState {
  server: string;
  nodeName: string;
  nodeList: Array<resQueryNode & { webApiDelay?: number | null }>;
  queryTradeLines: resQueryTradeLine[];
}
interface RequestResult {
  url: string;
  delay: number | null;
}

export const useNetwork = defineStore("network", {
  state: (): IState => {
    return {
      server: "",
      nodeName: "",
      nodeList: [],
      queryTradeLines: [],
    };
  },

  getters: {
    currentNode: (state) => {
      const target = state.nodeList.find((e) => e.nodeName === state.nodeName);
      if (target && target.webApiDelay !== null) {
        return target;
      }
      // 过滤无效节点 重新优选
      const successNodeList = state.nodeList.filter(
        (e) => e.webApiDelay !== null
      );
      const orderNodes = orderBy(successNodeList, ["webApiDelay"]);
      return orderNodes[0];
    },
    currentLine: (state) => {
      return state.queryTradeLines.find((e) => e.lineName === state.server);
    },
    port: (state) => {
      const target = state.nodeList.find((e) => e.nodeName === state.server);
      if (target) {
        return getPort(target.webApi);
      }
      return "";
    },
  },

  actions: {
    async initNode() {
      const userStore = useUser();
      if (userStore.account) {
        const queryNode = userStore.account.queryNode;
        const server = userStore.account.server;
        this.server = server;
        this.nodeName = queryNode;
        await this.getNodes(server);
      }
    },

    // 交易线路
    async getLines() {
      const res = await queryTradeLine({});
      this.queryTradeLines = res.data;
    },

    // 网络节点
    async getNodes(server: string) {
      const lineCode = this.queryTradeLines.find(
        (e) => e.lineName === server
      )?.lineCode;
      if (lineCode) {
        const res = await queryNode({
          lineCode,
          lineName: server,
        });
        this.nodeList = res.data;
        return this.nodeList;
      }
      return [];
    },

    // 节点延迟
    async getNodesDelay() {
      const webApiList = this.nodeList.map((item) => item.webApi);
      const requests: Promise<RequestResult>[] = webApiList.map((url) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          axios
            .get(url)
            .then(() => {
              const endTime = Date.now();
              const delay = endTime - startTime;
              resolve({ url, delay });
            })
            .catch(() => resolve({ url, delay: null }));
        });
      });
      const results = await Promise.all(requests);
      results.forEach((result) => {
        const target = this.nodeList.find((e) => e.webApi === result.url);
        if (target) {
          target.webApiDelay = result.delay;
        }
        console.log(`请求 ${result.url} 的延迟时间: ${result.delay} 毫秒`);
      });
      // 过滤掉未成功的请求（delay值为 null 的项）
      const successfulResults: RequestResult[] = results.filter(
        (result): result is RequestResult => result.delay !== null
      );
      if (!successfulResults.length) {
        ElMessage.error(i18n.global.t("tip.NodeUnavailable"));
      }
      return successfulResults;
    },

    openWebsite(href: string) {
      if (!process.env.IF_ELECTRON) {
        window.open(href, "_blank");
        return;
      }
      window.electronAPI.openExternal(href);
    },
  },
});

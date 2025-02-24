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

import { useUser } from "./user";

interface IState {
  server: string;
  nodeName: string;
  nodeList: Array<resQueryNode & { webApiDelay?: number }>;
  queryTradeLines: resQueryTradeLine[];
}
interface RequestResult {
  url: string;
  delay: number;
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
      return state.nodeList.find((e) => e.nodeName === state.nodeName);
    },
    currentLine: (state) => {
      return state.queryTradeLines.find((e) => e.lineName === state.server);
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
      const requests: Promise<RequestResult | undefined>[] = webApiList.map(
        (url) => {
          return new Promise((resolve) => {
            const startTime = Date.now();
            axios
              .get(url)
              .then(() => {
                const endTime = Date.now();
                const delay = endTime - startTime;
                resolve({ url, delay });
              })
              .catch((e) => e);
          });
        }
      );
      const results = await Promise.all(requests);
      // 过滤掉未成功的请求（值为 undefined 的项）
      const successfulResults: RequestResult[] = results.filter(
        (result): result is RequestResult => result !== undefined
      );
      successfulResults.forEach((result) => {
        const target = this.nodeList.find((e) => e.webApi === result.url);
        if (target) {
          target.webApiDelay = result.delay;
        }
        console.log(`请求 ${result.url} 的延迟时间: ${result.delay} 毫秒`);
      });
      if (!successfulResults.length) {
        ElMessage.error(i18n.global.t("tip.NodeUnavailable"));
      }
      return successfulResults;
    },
  },
});

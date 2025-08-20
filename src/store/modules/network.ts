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
import { orderBy, uniq, uniqBy } from "lodash";

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
      const target = state.nodeList.find((e) => e.nodeName === state.nodeName);
      if (target) {
        return getPort(target.webApi);
      }
      return "";
    },
    // 官方线路
    officialLine: (state) => {
      const target = state.queryTradeLines.find((e) => e.isOfficial === "1");
      return target;
    },
  },

  actions: {
    async initNode() {
      const userStore = useUser();
      if (userStore.account) {
        this.server = userStore.account.server;
        this.nodeName = userStore.account.queryNode;
      }
      // 如果没有设置服务器，则使用官方线路
      if (!this.server) {
        this.server = this.officialLine?.lineName || "";
      }
      await this.getNodes(this.server);
    },

    // 交易线路
    async getLines() {
      const accountList = useUser().state.accountList;
      const serverList = uniq(["", ...accountList.map((e) => e.server)]);
      for (let i = 0; i < serverList.length; i++) {
        const lineName = serverList[i];
        // 服务器设置了防抖 所以执行请求前等待1秒
        // if (i > 0) {
        //   await new Promise((resolve) => setTimeout(resolve, 3000));
        // }
        const res = await queryTradeLine({ lineName });
        this.queryTradeLines = uniqBy(
          [...res.data, ...this.queryTradeLines],
          "lineName"
        );
      }
    },

    // 网络节点
    async getNodes(server: string) {
      if (this.nodeList.length) {
        // 如果已经有节点列表，直接返回
        return this.nodeList;
      }
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
            .get(url, { timeout: 1500 })
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

    openWebsite(href: string, name?: string) {
      if (!process.env.IF_ELECTRON) {
        window.open(href, "_blank");
        return;
      }
      const webReg =
        /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/;
      if (webReg.test(href)) {
        window.electronAPI.invoke("openExternal", href);
        return;
      }
      console.log(name, href);
      window.electronAPI.invoke("open-new-window", { name, hash: href });
    },

    getDelay(webApi?: string) {
      const delay = this.nodeList.find(
        (e) => e.webApi === (webApi || this.currentNode.webApi)
      )?.webApiDelay;
      return delay || "-";
    },

    getDelayClass(webApi?: string) {
      const delay = this.getDelay(webApi);
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
    },
  },
});

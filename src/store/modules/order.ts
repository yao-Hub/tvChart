import { defineStore } from "pinia";
import { createApp } from "vue";
import { Modal } from "ant-design-vue";

import { useDialog } from "./dialog";
import { useChartAction } from "./chartAction";
import { useUser } from "./user";
import { useChartInit } from "./chartInit";

import * as types from "#/chart/index";
import * as orderTypes from "#/order";

import FastAddOrder from "@/components/FastAddOrder.vue";

interface State {
  currentQuotes: Record<string, types.Quote>;
  currentSymbol: string;
  currentKline: types.Line | null;
  refreshOrderArea: boolean;
  tableData: orderTypes.TableData;
  selectedMenuKey: orderTypes.OrderType;
  ifOne: boolean;
  ifQuick: boolean;
}

export const useOrder = defineStore("order", {
  state: (): State => {
    return {
      currentQuotes: {},
      currentSymbol: "",
      currentKline: null,
      refreshOrderArea: false,
      tableData: {},
      selectedMenuKey: "price",
      ifOne: false, // 一键交易
      ifQuick: false, // 快捷交易
    };
  },

  actions: {
    createOrder() {
      const dialogStore = useDialog();
      const userStore = useUser();
      if (!userStore.getToken()) {
        const chartActionStore = useChartAction();
        dialogStore.showLoginDialog();
        chartActionStore.setCacheAction("createOrder");
        return;
      }
      if (userStore.loginInfo?.trade_rights !== 1) {
        Modal.error({
          title: "无权限",
          content: "当前账户禁止交易",
        });
        return;
      }
      dialogStore.showOrderDialog();
    },

    setOneTrans(result: boolean) {
      this.ifOne = result;
      window.localStorage.setItem("ifOneTrans", JSON.stringify(result));
    },

    getOneTrans() {
      const result =
        window.localStorage.getItem("ifOneTrans") || JSON.stringify(false);
      this.ifOne = JSON.parse(result);
      return result;
    },

    // 添加快捷下单按钮
    addOrderBtn() {
      this.ifQuick = true;
      window.localStorage.setItem("ifOneQuick", JSON.stringify(true));
      const chartInitStore = useChartInit();
      const iframes = Array.from(document.querySelectorAll("iframe"));
      let ifExistBtn = false;
      iframes.forEach((iframe) => {
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow!.document;
        const btn = iframeDocument.querySelector("#chartOrderBtn");
        if (btn) {
          ifExistBtn = true;
          const grandpa = <HTMLElement>btn.parentNode?.parentNode;
          grandpa.style.display = "flex";
        }
      });
      if (ifExistBtn) {
        return;
      }
      chartInitStore.chartWidgetList.forEach((item) => {
        const widget = item.widget;
        widget?.headerReady().then(() => {
          const Button = widget.createButton();
          Button.setAttribute("id", "chartOrderBtn");
          const grandpa = <HTMLElement>Button.parentNode?.parentNode;
          const separator = <HTMLElement>grandpa.nextSibling;
          separator.remove();
          const symbol = widget.activeChart().symbol();
          const orderComp = createApp(FastAddOrder, { symbol, id: item.id });
          orderComp.mount(Button);
        });
      });
    },

    hideOrderBtn() {
      window.localStorage.setItem("ifOneQuick", JSON.stringify(false));
      this.ifQuick = false;
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget();
      widget?.headerReady().then(() => {
        const iframes = document.querySelectorAll("iframe");
        iframes.forEach((iframe) => {
          if (iframe) {
            const iframeDocument =
              iframe.contentDocument || iframe.contentWindow!.document;
            const btn = iframeDocument.querySelector("#chartOrderBtn");
            const grandpa = <HTMLElement>btn?.parentNode?.parentNode;
            grandpa.style.display = "none";
          }
        });
      });
    },

    getQuickTrans() {
      const result =
        window.localStorage.getItem("ifOneQuick") || JSON.stringify(false);
      this.ifQuick = JSON.parse(result);
    },
  },
});

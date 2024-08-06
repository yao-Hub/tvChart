import { defineStore } from "pinia";
import { createApp } from "vue";
import { useRouter } from "vue-router";
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
      ifQuick: false, // 快捷交易(图表是否显示快捷交易组件)
    };
  },

  actions: {
    createOrder() {
      const dialogStore = useDialog();
      const userStore = useUser();
      if (!userStore.getToken()) {
        const router = useRouter();
        router.replace({ name: 'login' });
        const chartActionStore = useChartAction();
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

    // 设置一键交易状态
    setOneTrans(result: boolean) {
      this.ifOne = result;
      window.localStorage.setItem("ifOne", JSON.stringify(result));
    },

    // 获取一键交易状态
    getOneTrans() {
      const result = window.localStorage.getItem("ifOne");
      this.ifOne = JSON.parse(result || JSON.stringify(false));
      return result;
    },

    // 添加快捷下单组件
    addOrderBtn() {
      this.ifQuick = true;
      window.localStorage.setItem("ifQuick", JSON.stringify(true));
      const chartInitStore = useChartInit();
      const iframes = Array.from(document.querySelectorAll("iframe"));
      iframes.forEach((iframe) => {
        const iframeDocument =
          iframe.contentDocument || iframe.contentWindow!.document;
        const btn = iframeDocument.querySelector("#chartOrderBtn");
        if (btn) {
          const grandpa = <HTMLElement>btn.parentNode?.parentNode;
          grandpa.style.display = "flex";
          return;
        }
        const chartItem = iframe.closest('.charts_container_item');
        const id = chartItem?.getAttribute('id');
        if (id) {
          const widget = chartInitStore.getChartWidget(id);
          widget?.headerReady().then(() => {
            const Button = widget.createButton();
            Button.setAttribute("id", "chartOrderBtn");
            const grandpa = <HTMLElement>Button.parentNode?.parentNode;
            const separator = <HTMLElement>grandpa.nextSibling;
            separator.remove();
            const symbol = widget.activeChart().symbol();
            const orderComp = createApp(FastAddOrder, { symbol, id });
            orderComp.mount(Button);
          });
        }
      });
    },

    // 隐藏快捷下单组件
    hideOrderBtn() {
      window.localStorage.setItem("ifQuick", JSON.stringify(false));
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

    // 获取快捷交易状态
    getQuickTrans() {
      const result =
        window.localStorage.getItem("ifQuick") || JSON.stringify(false);
      this.ifQuick = JSON.parse(result);
    },
  },
});

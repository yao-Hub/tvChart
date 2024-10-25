import { defineStore } from "pinia";
// import { createApp } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useDialog } from "./dialog";
import { useChartAction } from "./chartAction";
import { useUser } from "./user";
// import { useChartInit } from "./chartInit";

import * as types from "#/chart/index";
import * as orderTypes from "#/order";

// import FastAddOrder from "@/components/FastAddOrder.vue";

interface State {
  currentQuotes: Record<string, types.Quote>;
  currentSymbol: string;
  currentKline: Record<string, types.Line>;
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
      currentKline: {},
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
        ElMessageBox.confirm("", "未登录", {
          confirmButtonText: "去登录",
          cancelButtonText: "取消",
          type: "warning",
        }).then(() => {
          const router = useRouter();
          const chartActionStore = useChartAction();
          chartActionStore.setCacheAction("createOrder");
          router.replace({ name: "login" });
        });
        return;
      }
      if (userStore.loginInfo?.trade_rights !== 1) {
        ElMessageBox.alert("当前账户禁止交易", "无权限", {
          confirmButtonText: "确认",
          type: "error",
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

    // 获取快捷交易状态
    getQuickTrans() {
      const result =
        window.localStorage.getItem("ifQuick") || JSON.stringify(false);
      this.ifQuick = JSON.parse(result);
      return this.ifQuick;
    },
  },
});

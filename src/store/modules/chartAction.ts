import { defineStore } from "pinia";
import { createApp } from "vue";
import { ResolutionString } from "public/charting_library/charting_library";
import i18n from "@/language/index";

import { useChartInit } from "./chartInit";
import { useOrder } from "./order";

import FastAddOrder from "@/components/FastAddOrder.vue";
interface State {
  cacheAction: string;
  line: any;
}

export const useChartAction = defineStore("chartAction", {
  state: (): State => {
    return {
      // 即将执行的动作
      cacheAction: "",
      line: {
        default: true,
        tp: false,
        sl: false,
      },
    };
  },
  actions: {
    setCacheAction(action: string) {
      this.cacheAction = action;
    },
    clearCacheAction() {
      this.cacheAction = "";
    },

    // 改变周期
    changeResolution({
      id,
      resolution,
    }: {
      id: string;
      resolution: ResolutionString;
    }) {
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget(id);
      widget?.onChartReady(() => {
        widget.activeChart().setResolution(resolution);
      });
    },

    // 添加快捷下单按钮
    addOrderBtn(id: string) {
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget(id);
      widget?.headerReady().then(() => {
        const Button = widget.createButton();
        Button.setAttribute("id", "fastOrderBtn");
        Button.classList.add("fastOrderBtn");
        const grandpa = <HTMLElement>Button.parentNode?.parentNode;
        grandpa.style.order = "-1";
        const separator = <HTMLElement>grandpa.nextSibling;
        separator.remove();
        const symbol = widget.activeChart().symbol();
        const orderComp = createApp(FastAddOrder, { symbol, id });
        orderComp.use(i18n);
        orderComp.mount(Button);

        const orderStore = useOrder();
        const ifQuick = orderStore.getQuickTrans();
        this.toggleOrderBtn(ifQuick);
      });
    },
    toggleOrderBtn(visable: boolean) {
      const iframes = document.querySelectorAll("iframe");
      iframes.forEach((ifr) => {
        const ifrDom = ifr.contentDocument || ifr.contentWindow!.document;
        const orderBtn = ifrDom.querySelector("#fastOrderBtn");
        const grandpa = <HTMLElement>orderBtn?.parentNode?.parentNode;
        if (grandpa) {
          grandpa.style.display = visable ? "flex" : "none";
        }
      });
    },

    // 增加订单线
    createOrderLine(id: string) {
      const chartInitStore = useChartInit();

      const widget = chartInitStore.getChartWidget(id);
      widget?.onChartReady(() => {
        const orderLine = widget.activeChart().createOrderLine();
        const price = orderLine.getPrice().toString();
        orderLine
          .setText(price)
          .onModify("onModify called", () => {
            console.log("onModify called");
          })
          .onMove("move", () => {
            orderLine.setText(orderLine.getPrice().toString());
          })
          .onCancel("", () => {
            orderLine.remove();
          })
          .setTooltip("Additional order information")
          .setModifyTooltip("Modify order")
          .setCancelTooltip("Cancel order")
          .setQuantity("1")
          .setPrice(2733);

        const positionLine = widget?.chart().createPositionLine();
        positionLine
          .onModify(function () {
            positionLine.setText("onModify called");
          })
          .onReverse("onReverse called", function (text) {
            positionLine.setText(text);
          })
          .onClose("onClose called", function (text) {
            positionLine.setText(text);
          })
          .setText("PROFIT: 71.1 (3.31%)")
          .setTooltip("Additional position information")
          .setProtectTooltip("Protect position")
          .setCloseTooltip("Close position")
          .setReverseTooltip("Reverse position")
          .setQuantity("8.235")
          .setPrice(2730)
          .setExtendLeft(false)
          .setLineStyle(0)
          .setLineLength(25);
      });
    },
  },
});

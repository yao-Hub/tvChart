import { defineStore } from "pinia";
import { createApp } from "vue";
import { ResolutionString } from "public/charting_library/charting_library";
import i18n from "@/language/index";

import { useChartInit } from "./chartInit";
import { useOrder } from "./order";

import FastAddOrder from "@/components/FastAddOrder.vue";
interface State {
  cacheAction: string;
}

export const useChartAction = defineStore("chartAction", {
  state: (): State => {
    return {
      // 即将执行的动作
      cacheAction: "",
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
      id?: string;
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
  },
});

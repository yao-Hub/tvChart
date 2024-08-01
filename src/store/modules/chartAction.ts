import { defineStore } from "pinia";
import { createApp } from "vue";
import FastAddOrder from "@/components/FastAddOrder.vue";
// import i18n from "@/language/index";
// import { LOCALE_SINGLE_LIST as lacaleList, TOOLBAR_BTN_ORDER as orders } from '@/constants/common';
import { useChartInit } from "./chartInit";
// import { useDialog } from './dialog';
// import { useUser } from './user';
// import { useOrder } from './order';
// import { avatar } from '@/assets/icons/index';
import { ResolutionString } from "public/charting_library/charting_library";

// const dialogStore = useDialog();
// const userStore = useUser();

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
    // 添加快捷下单按钮
    addOrderBtn(id: string) {
      const chartInitStore = useChartInit();
      const widget = chartInitStore.getChartWidget(id);
      widget?.headerReady().then(() => {
        const Button = widget.createButton();
        Button.setAttribute("id", "chartOrderBtn");
        const symbol = widget.activeChart().symbol();
        const orderComp = createApp(FastAddOrder, { symbol });
        orderComp.mount(Button);
      });
    },
    // // 增加左上角头像
    // createAvatar(id?: string) {
    //   const widget = chartInitStore.getChartWidget(id);
    //   const username = userStore.loginInfo ? userStore.loginInfo.total_name || userStore.account.login : '';
    //   widget?.headerReady().then(() => {
    //     const iframe = document.querySelector('iframe');
    //     if (iframe) {
    //       const iframeDocument = iframe.contentDocument || iframe.contentWindow!.document;
    //       const ifAvatar = iframeDocument.querySelector('.Avatar');
    //       if (ifAvatar) {
    //         ifAvatar.innerHTML = username.substring(0, 1);
    //         ifAvatar.setAttribute('title', username || i18n.global.t('tip.needLogin'));
    //         return;
    //       }
    //     }

    //     const Button = widget.createButton();
    //     Button.setAttribute('title', username || i18n.global.t('tip.needLogin'));

    //     const grandpa = <HTMLElement>Button.parentNode?.parentNode;
    //     grandpa.style.order = orders.Avatar;

    //     const separator = <HTMLElement>grandpa.previousSibling;
    //     separator.remove();

    //     const parent = <HTMLElement>Button.parentNode;
    //     parent.style.justifyContent = 'center';
    //     parent.style.width = '52px';

    //     Button.style.backgroundColor = '#609f83';
    //     Button.style.borderRadius = '50%';
    //     Button.style.height = '28px';
    //     Button.style.width = '28px';
    //     Button.style.display = 'flex';
    //     Button.style.justifyContent = 'center';
    //     Button.style.alignItems = 'center';
    //     Button.style.fontSize = '16px';
    //     Button.style.color = '#fff';
    //     Button.style.margin = '0';
    //     Button.style.padding = '0';

    //     Button.innerHTML = username ? username.substring(0, 1) : avatar;
    //     Button.classList.add('Avatar');
    //     Button.addEventListener('click', () => {
    //       if (!userStore.ifLogin) {
    //         dialogStore.showLoginDialog();
    //       }
    //     });
    //   });
    // },

    // // 增加顶部语言切换按钮
    // createLocaleBtn(id?: string) {
    //   const widget = chartInitStore.getChartWidget(id);
    //   let currentlocale = i18n.global.locale.value;
    //   widget?.headerReady().then(() => {
    //     const Button = widget.createButton({
    //       align: 'right',
    //       useTradingViewStyle: false
    //     });
    //     Button.setAttribute('title', i18n.global.t('switchLanguage'));
    //     Button.innerHTML = lacaleList[currentlocale === "en" ? "zh" : "en"];
    //     Button.addEventListener('click', () => {
    //       currentlocale = currentlocale === "en" ? "zh" : "en";
    //       Button.innerHTML = lacaleList[currentlocale];
    //       currentlocale = currentlocale;
    //       localStorage.setItem('language', currentlocale);
    //       window.location.reload();
    //     });
    //   });
    // },

    // 增加订单线
    // createOrderLine(id: string) {
    //   const widget = chartInitStore.getChartWidget(id);
    //   widget?.onChartReady(() => {
    //     const orderLine = widget.activeChart().createOrderLine();
    //     const price = orderLine.getPrice().toString();
    //     orderLine
    //       .setText(price)
    //       .onModify("onModify called", () => {
    //         dialogStore.showOrderDialog();
    //       })
    //       .onMove("move", () => {
    //         orderLine.setText(orderLine.getPrice().toString());
    //       })
    //       .onCancel("", () => {
    //         orderLine.remove();
    //       })
    //       .setTooltip("Additional order information")
    //       .setModifyTooltip("Modify order")
    //       .setCancelTooltip("Cancel order")
    //       .setQuantity("1");
    //   });
    // },

    // 增加新订单按钮
    // createAddOrderBtn(id?: string) {
    //   const widget = chartInitStore.getChartWidget(id);
    //   widget?.headerReady().then(() => {
    //     const orderStore = useOrder();

    //     const Button = widget.createButton();
    //     Button.style.border = '1px solid #fff';
    //     Button.style.borderRadius = '4px';
    //     Button.style.cursor = 'pointer';
    //     Button.setAttribute('title', `${i18n.global.t('order.new', { type: i18n.global.t('order.create') })}: F9`);
    //     Button.onmouseover = () => {
    //       Button.style.background = 'rgb(89, 89, 89)';
    //     };
    //     Button.onmouseout = () => {
    //       Button.style.background = 'unset';
    //     };
    //     Button.onmouseup = () => {
    //       orderStore.createOrder();
    //     };

    //     const grandpa = <HTMLElement>Button.parentNode?.parentNode;
    //     grandpa.style.order = orders.AddOrder;

    //     const separator = <HTMLElement>grandpa.previousSibling;
    //     separator.style.order = orders.AddOrderSeparator;

    //     Button.innerText = i18n.global.t('order.new');
    //   });
    // },

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
  },
});

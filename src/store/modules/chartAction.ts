import { defineStore } from 'pinia';
import i18n from "@/language/index"
import { LOCALE_SINGLE_LIST as lacaleList, TOOLBAR_BTN_ORDER as orders } from '@/constants/common';
import chartInitStore from './chartInit';
import chartDialogStore from './chartDialog';

const dialogStore = chartDialogStore();
const chartInit = chartInitStore();

export default defineStore('chartActionStore', {
  getters: {
    widget: () => chartInit.getChartWidget()
  },
  actions: {
    // 增加左上角头像
    createAvatar() {
      this.widget.headerReady().then(() => {
        const Button = this.widget.createButton();
        const grandpa = <HTMLElement>Button.parentNode?.parentNode;
        grandpa.style.order = orders.Avatar;

        const separator = <HTMLElement>grandpa.previousSibling;
        separator.remove();

        const parent = <HTMLElement>Button.parentNode;
        parent.style.justifyContent = 'center';
        parent.style.width = '52px';

        Button.style.backgroundColor = '#609f83';
        Button.style.borderRadius = '50%';
        Button.style.height = '28px';
        Button.style.width = '28px';
        Button.style.display = 'flex';
        Button.style.justifyContent = 'center';
        Button.style.alignItems = 'center';
        Button.style.fontSize = '20px';
        Button.style.color = '#fff';
        Button.style.margin = '0';
        Button.style.padding = '0';

        Button.innerText = 'Y';
      })
    },

    // 增加顶部语言切换按钮
    createLocaleBtn() {
      let currentlocale = i18n.global.locale.value;
      this.widget.headerReady().then(() => {
        const Button = this.widget.createButton({
          align: 'right',
          useTradingViewStyle: false
        });
        Button.setAttribute('title', i18n.global.t('switchLanguage'));
        Button.innerHTML = lacaleList[currentlocale === "en" ? "zh" : "en"];
        Button.addEventListener('click', () => {
          currentlocale = currentlocale === "en" ? "zh" : "en";
          Button.innerHTML = lacaleList[currentlocale];
          currentlocale = currentlocale;
          localStorage.setItem('language', currentlocale)
          window.location.reload();
        });
      })
    },

    // 增加订单线
    createOrderLine() {
      this.widget.onChartReady(() => {
        const orderLine = this.widget.activeChart().createOrderLine();
        const price = orderLine.getPrice().toString();
        orderLine
          .setText(price)
          .onModify("onModify called", () => {
            dialogStore.showOrderDialog();
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
          .setQuantity("1");
      });
    },

    // 增加新订单按钮
    createAddOrderBtn() {
      this.widget.headerReady().then(() => {
        const Button = this.widget.createButton();
        Button.style.border = '1px solid #fff';
        Button.style.borderRadius = '4px';
        Button.style.cursor = 'pointer';
        Button.setAttribute('title', `${i18n.global.t('order.new', {type: i18n.global.t('order.create')})}: F9`);
        Button.onmouseover = () => {
          Button.style.background = 'rgb(89, 89, 89)';
        }
        Button.onmouseout = () => {
          Button.style.background = 'unset';
        }
        Button.onmouseup = () => {
          dialogStore.showOrderDialog();
        }

        const grandpa = <HTMLElement>Button.parentNode?.parentNode;
        grandpa.style.order = orders.AddOrder;

        const separator = <HTMLElement>grandpa.previousSibling;
        separator.style.order = orders.AddOrderSeparator;

        Button.innerText = i18n.global.t('order.new');
      })
    }
  }
})

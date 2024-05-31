import  * as library from 'public/charting_library';
import { LOCALE_SINGLE_LIST } from '@/constants/common';
const lacaleList = LOCALE_SINGLE_LIST;

export class chartReady {
  private readonly widget;
  constructor(widget: library.IChartingLibraryWidget) {
    this.widget = widget
  }

  // 增加顶部下拉菜单
  createDropdown = () => {
    this.widget.headerReady().then(async () => {
      const myDropdownApi = await this.widget.createDropdown(
        {
          title: 'dropdown',
          tooltip: 'tooltip for this dropdown',
          items: [
            {
              title: 'item#1',
              onSelect: () => { console.log('1'); },
            },
            {
              title: 'item#3',
              onSelect: () => {
                this.widget.activeChart().createStudy(
                  'MACD',
                  false,
                  false,
                  {
                    in_0: 14,
                    in_1: 30,
                    in_3: 'close',
                    in_2: 9
                  }
                );
              },
            }
          ],
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><g fill="none" stroke="currentColor"><circle cx="10" cy="10" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path stroke-linecap="square" d="M17.5 7.5l-7 13"/></g></svg>`,
        }
      )
      // Use myDropdownApi if you need to update the dropdown:
      myDropdownApi.applyOptions({
        title: 'a new title!'
      });
      // Or remove the dropdown:
      // myDropdownApi.remove();
    });
  }

  // 增加顶部语言切换按钮
  createLocaleBtn = (nowLocale: string, callback: (result: string) => void) => {
    let currentLanguage = nowLocale as keyof typeof lacaleList;
    this.widget.headerReady().then(() => {
      const Button = this.widget.createButton({
        align: 'right',
        useTradingViewStyle: false
      });
      Button.innerHTML = lacaleList[currentLanguage === "en" ? "zh" : "en"];
      Button.addEventListener('click', () => {
        currentLanguage = currentLanguage === "en" ? "zh" : "en";
        Button.innerHTML = lacaleList[currentLanguage];
        callback(currentLanguage);
      });
    })
  }

  // 增加订单线
  createOrderLine = () => {
    this.widget.onChartReady(() => {
      const orderLine = this.widget.activeChart().createOrderLine();
      orderLine.setTooltip("Additional order information")
        .setModifyTooltip("Modify order")
        .setCancelTooltip("Cancel order")
        .onMove(function () {
          orderLine.setText("onMove called");
        })
        .onModify("onModify called", () => {
          orderLine.setText("onModify");
        })
        .onCancel("onCancel called", () => {
          orderLine.setText("onCancel");
        })
        .setText("STOP: 73.5 (5,64%)")
        .setQuantity("5");
    });
  }

  // 设置右键菜单
  setContextMenu = () => {
    this.widget.onContextMenu((unixtime: number, price: number): library.ContextMenuItem[] => {
      return [
        {
          position: "top",
          text: "提示框",
          click: () => {
            this.widget.showNoticeDialog({
              title: 'title',
              body: `time: ${unixtime}, price: ${price}`,
              callback: () => { }
            });
          }
        },
        {
          position: "top",
          text: "加载布局",
          click: () => {
            this.widget.showLoadChartDialog();
          }
        },
        { text: "-", position: "top", click: () => {} }
      ];
    });
  }
}

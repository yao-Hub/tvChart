import { debounce } from "lodash";
import Sortable from "sortablejs";
import { useChartSub } from "@/store/modules/chartSub";
import { useChartInit } from "@/store/modules/chartInit";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();

const moving = {
  horizontalLine: false,
  verticalLine: false,
};

const minWidht = 200;
const minHeight = 150;
const lineWidth = 5;
const marginTop = 5;
const lineColor = "#7cb305";

// 水平线初始拉伸位置
let startY: number;

// 初始化拖拽实例
function initDragArea() {
  const nestedSortables = [].slice.call(
    document.querySelectorAll(".nested-sortable")
  );
  for (let i = 0; i < nestedSortables.length; i++) {
    const item = nestedSortables[i] as HTMLElement;
    const itemId = item.getAttribute("data-id");
    new Sortable(item, {
      group: "nested",
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 1,
      handle: ".handle",
      onStart: () => {
        const dragArea_items = document.querySelectorAll(
          ".dragArea_item"
        ) as NodeListOf<Element>;
        const emptyChildItems = Array.from(dragArea_items).filter(
          (item) => item.querySelectorAll(".demo").length === 0
        );
        if (emptyChildItems.length) {
          dragArea_items.forEach((item) => {
            const element = item as HTMLElement;
            const height = item.getBoundingClientRect().height;
            if (height === 0) {
              element.style.height = "300px";
            } else {
              element.style.height = `${height - 300}px`;
            }
          });
        }
      },
      onEnd: () => {
        setTimeout(() => {
          resizeUpdate();
          rememberAttr();
          chartInitStore.syncSetChart();
        }, 200);
      },
      store: {
        // get: function () {
        //   const order = localStorage.getItem(itemId);
        //   return order ? order.split("|") : [];
        // },
        set: function (sortable: any) {
          const order = sortable.toArray();
          if (itemId) {
            localStorage.setItem(itemId, order.join("|"));
          }
        },
      },
    });
  }
  // 还原缓存的item样式
  const inw = window.innerWidth;
  const inh = window.innerHeight;
  const stoAttr = localStorage.getItem("attr");
  let targetAttr = null;
  if (stoAttr) {
    const attr = JSON.parse(stoAttr);
    if (attr.inw === inw && attr.inh === inh) {
      targetAttr = attr;
    }
  }
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  if (targetAttr) {
    const itemStyles = targetAttr.itemStyles;
    dragArea_items.forEach((item) => {
      const itemId = item.getAttribute("data-id") as string;
      const style = itemStyles[itemId];
      item.setAttribute("style", style);
    });
  } else {
    setDragAreaSize();
  }
}

// 拖拽区域大小
function setDragAreaSize() {
  function setSize(arr: NodeListOf<Element> | Element[]) {
    const dragArea = document.querySelector(".dragArea") as HTMLElement;
    const dh = dragArea.getBoundingClientRect().height;
    arr.forEach((item) => {
      const element = item as HTMLElement;
      // 整个区域的高度 / dragArea_item的数量 - 拉伸线的高度 * 水平拉伸线的数量（dragArea_item的数量 - 1）
      element.style.height = dh / arr.length - lineWidth * (arr.length - 1) + "px";
      element.style.marginTop = marginTop + "px";
    });
  }
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  const emptyChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length === 0
  );
  emptyChildItems.forEach((item) => {
    const element = item as HTMLElement;
    element.style.height = "0";
  });
  setSize(emptyChildItems.length > 0 ? haveChildItems : dragArea_items);
}

function initDemosPosition() {
  // 还原缓存的item样式
  const inw = window.innerWidth;
  const inh = window.innerHeight;
  const stoAttr = localStorage.getItem("attr");
  let targetAttr = null;
  if (stoAttr) {
    const attr = JSON.parse(stoAttr);
    if (attr.inw === inw && attr.inh === inh) {
      targetAttr = attr;
    }
  }
  const demos = document.querySelectorAll(".demo");
  if (targetAttr) {
    const demoStyles = targetAttr.demoStyles;
    demos.forEach((item) => {
      const itemId = item.getAttribute("data-id") as string;
      const style = demoStyles[itemId];
      item.setAttribute("style", style);
    });
  } else {
    setDemoPosition();
  }
}

// 定位demo的具体位置
function setDemoPosition() {
  const dragArea = document.querySelector(".dragArea") as HTMLElement;
  const dw = dragArea.getBoundingClientRect().width;
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  dragArea_items.forEach((item) => {
    const demos = item.querySelectorAll(".demo");
    demos.forEach((demo, index) => {
      const element = demo as HTMLElement;
      element.style.height = item.getBoundingClientRect().height + "px";
      element.style.top = "0";
      element.style.width =
        dw / demos.length - (lineWidth / 2) * (demos.length - 1) + "px";
      if (index === 0) {
        element.style.left = "0";
      } else {
        element.style.left = (dw / demos.length) * index + lineWidth / 2 + "px";
      }
    });
  });
}

// 增加水平线
function createHoriLine(addNum: number) {
  for (let index = 0; index < addNum; index++) {
    const line = document.createElement("div");
    line.className = "resize_handler_vertical";
    line.style.position = "absolute";
    line.style.height = lineWidth + "px";
    line.style.cursor = "ns-resize";
    line.style.left = "0";
    line.style.top = "0";
    line.addEventListener("mouseover", function () {
      line.style.backgroundColor = lineColor;
    });
    line.addEventListener("mouseout", function () {
      if (moving.verticalLine) {
        return;
      }
      line.style.backgroundColor = "";
    });
    document.addEventListener("mouseup", function () {
      line.style.backgroundColor = "";
      moving.verticalLine = false;
      document
        .querySelectorAll(".resize_handler_horizontal")
        .forEach((item) => {
          (item as HTMLElement).style.removeProperty("display");
        });
    });
    line.addEventListener("mousedown", (e) => {
      document
        .querySelectorAll(".resize_handler_horizontal")
        .forEach((item) => {
          (item as HTMLElement).style.display = "none";
        });
      moving.verticalLine = true;
      startY = e.pageY;
      resizeVertical(e);
    });
    document.querySelector(".dragArea")?.appendChild(line);
  }
}

// 水平线位置
function updateHoriLine() {
  const headerHight =
    document.querySelector(".header")?.getBoundingClientRect().height || 48;
  let count = 0;
  const dragArea_items = document.querySelectorAll(
    ".dragArea_item"
  ) as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  const vertLine = document.querySelectorAll(
    ".resize_handler_vertical"
  ) as NodeListOf<HTMLElement>;
  haveChildItems.forEach((item, index, arr) => {
    if (index > 0) {
      const element = arr[index - 1] as HTMLElement;
      vertLine[count].style.top = `${
        element.getBoundingClientRect().bottom - headerHight
      }px`;
      vertLine[count].style.width =
        element.getBoundingClientRect().width + "px";
      count++;
    }
  });
}

// 水平线垂直拉伸
const resizeVertical = (event: MouseEvent) => {
  chartSubStore.chartsLoading = true;
  let result: HTMLDivElement[] = [];

  const lineTarget = event.target as HTMLDivElement;
  const lineX = lineTarget.getBoundingClientRect().x;
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  const sameXItems = haveChildItems.filter((item) => {
    const itemX = item.getBoundingClientRect().x;
    // 使用一个误差范围来比较浮点数
    const epsilon = 3;
    return Math.abs(itemX - lineX) < epsilon;
  });

  // 查找线两边的item
  let minDiff = window.innerHeight;
  const lineY = lineTarget.getBoundingClientRect().y;
  for (let i = 0; i < sameXItems.length - 1; i++) {
    const preDemoY = sameXItems[i].getBoundingClientRect().y;
    const nextDemoY = sameXItems[i + 1].getBoundingClientRect().y;
    if (preDemoY < lineY && nextDemoY > lineY) {
      let diff = nextDemoY - preDemoY;
      if (diff < minDiff) {
        minDiff = diff;
        result = [
          sameXItems[i] as HTMLDivElement,
          sameXItems[i + 1] as HTMLDivElement,
        ];
      }
    }
  }
  const result_0_height = result[0].getBoundingClientRect().height;
  const result_1_height = result[1].getBoundingClientRect().height;
  const headerHight =
    document.querySelector(".header")?.getBoundingClientRect().height || 48;

  function resize(e: MouseEvent) {
    let mouseY = e.clientY - headerHight;
    const offset = e.pageY - startY;
    const topHeight = result_0_height + offset;
    const downHeight = result_1_height - offset;
    if (topHeight < minHeight || downHeight < minHeight) {
      return;
    }
    lineTarget.style.top = `${mouseY - lineWidth / 2}px`;
    result[0].style.height = `${topHeight}px`;
    result[0]
      .querySelectorAll(".demo")
      .forEach(
        (item) => ((item as HTMLElement).style.height = `${topHeight}px`)
      );
    result[1].style.height = `${downHeight}px`;
    result[1]
      .querySelectorAll(".demo")
      .forEach(
        (item) => ((item as HTMLElement).style.height = `${downHeight}px`)
      );
  }

  function stopResize() {
    chartSubStore.chartsLoading = false;
    updateVertLine();
    rememberAttr();
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
  }

  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
};

// 删除水平线
function delHoriLine(delNum: number) {
  let count = delNum;
  const horiLines = document.querySelectorAll(".resize_handler_vertical");
  horiLines.forEach((item) => {
    if (count > 0) {
      item.remove();
      count--;
    }
  });
}

// 水平线curd
function operaHoriLine() {
  const dragArea_items = document.querySelectorAll(
    ".dragArea_item"
  ) as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  const horiLines = document.querySelectorAll(".resize_handler_vertical");
  // 新增
  if (horiLines.length < haveChildItems.length - 1) {
    createHoriLine(haveChildItems.length - 1);
  }
  // 删除
  if (horiLines.length > haveChildItems.length - 1) {
    delHoriLine(horiLines.length - haveChildItems.length + 1);
  }
  updateHoriLine();
}

// 增加竖直线
function createVertLine(addNum: number) {
  for (let index = 0; index < addNum; index++) {
    const line = document.createElement("div");
    line.className = "resize_handler_horizontal";
    line.style.position = "absolute";
    line.style.width = lineWidth + "px";
    line.style.cursor = "ew-resize";
    line.addEventListener("mouseover", function () {
      line.style.backgroundColor = lineColor;
    });
    line.addEventListener("mouseout", function () {
      if (moving.horizontalLine) {
        return;
      }
      line.style.backgroundColor = "";
    });
    document.addEventListener("mouseup", function () {
      line.style.backgroundColor = "";
      moving.horizontalLine = false;
    });
    line.addEventListener("mousedown", (e) => {
      moving.horizontalLine = true;
      resizeHorizontal(e);
    });
    document.querySelector(".dragArea")?.appendChild(line);
  }
}

// 删除竖直线
function delVertLine(delNum: number) {
  let count = delNum;
  const vertLines = document.querySelectorAll(".resize_handler_horizontal");
  vertLines.forEach((item) => {
    if (count > 0) {
      item.remove();
      count--;
    }
  });
}

// 更新竖直线的位置
function updateVertLine() {
  const headerHight =
    document.querySelector(".header")?.getBoundingClientRect().height || 48;
  let count = 0;
  const vertLines = document.querySelectorAll(
    ".resize_handler_horizontal"
  ) as NodeListOf<HTMLElement>;
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  haveChildItems.forEach((item) => {
    const demos = item.querySelectorAll(".demo");
    demos.forEach((demo, index) => {
      if (index > 0) {
        const x = demo.getBoundingClientRect().x;
        const height = demo.getBoundingClientRect().height;
        const y = demo.getBoundingClientRect().y;
        vertLines[count].style.top = `${y - headerHight}px`;
        vertLines[count].style.height = `${height}px`;
        vertLines[count].style.left = `${x - lineWidth}px`;
        count++;
      }
    });
  });
}

// 竖直线curd
function operaVertLine() {
  let lineCount = 0;
  const dragArea_items = document.querySelectorAll(
    ".dragArea_item"
  ) as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length !== 0
  );
  haveChildItems.forEach((item) => {
    const demos = item.querySelectorAll(".demo");
    const needLineCount = demos.length > 1 ? demos.length - 1 : 0;
    lineCount += needLineCount;
  });
  const vertLines = document.querySelectorAll(".resize_handler_horizontal");
  // 新增
  if (vertLines.length < lineCount) {
    createVertLine(lineCount - vertLines.length);
  }
  // 删除
  if (vertLines.length > lineCount) {
    delVertLine(vertLines.length - lineCount);
  }
  updateVertLine();
}

// 竖直线水平拉伸
function resizeHorizontal(event: MouseEvent) {
  chartSubStore.chartsLoading = true;
  let result: HTMLDivElement[] = [];
  const demos = document.querySelectorAll(".demo");
  const lineTarget = event.target as HTMLDivElement;
  const lineY = lineTarget.getBoundingClientRect().y;
  // 跟线在同一层的demo
  const sameYDemos = Array.from(demos).filter((item) => {
    const itemY = item.getBoundingClientRect().y;
    // 使用一个误差范围来比较浮点数
    const epsilon = 3;
    return Math.abs(itemY - lineY) < epsilon;
  });
  // 查找线两边的demo
  let minDiff = window.innerWidth;
  const lineX = lineTarget.getBoundingClientRect().x;
  for (let i = 0; i < sameYDemos.length - 1; i++) {
    const preDemoX = sameYDemos[i].getBoundingClientRect().x;
    const nextDemoX = sameYDemos[i + 1].getBoundingClientRect().x;
    if (preDemoX < lineX && nextDemoX > lineX) {
      let diff = nextDemoX - preDemoX;
      if (diff < minDiff) {
        minDiff = diff;
        result = [
          sameYDemos[i] as HTMLDivElement,
          sameYDemos[i + 1] as HTMLDivElement,
        ];
      }
    }
  }

  function resize({ clientX }: MouseEvent) {
    let lineLeft = clientX;
    let leftWidht = clientX - result[0].getBoundingClientRect().left;
    let rightWidht = result[1].getBoundingClientRect().right - clientX;
    if (leftWidht < minWidht || rightWidht < minWidht) {
      return;
    }
    result[0].style.width = `${leftWidht}px`;
    result[1].style.width = `${rightWidht - lineWidth}px`;
    result[1].style.left = `${lineLeft + lineWidth}px`;
    lineTarget.style.left = `${lineLeft}px`;
  }

  function stopResize() {
    chartSubStore.chartsLoading = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
    rememberAttr();
  }
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
}

export const resizeUpdate = debounce(() => {
  setDragAreaSize();
  setDemoPosition();
  operaHoriLine();
  operaVertLine();
}, 20);

// 记住拉伸的样式
function rememberAttr() {
  const inw = window.innerWidth;
  const inh = window.innerHeight;
  const itemStyles: Record<string, any> = {};
  // 记住上下区域的高度
  const dragAreaItem = document.querySelectorAll(".dragArea_item");
  dragAreaItem.forEach((item) => {
    const dataId = item.getAttribute("data-id");
    const style = item.getAttribute("style");
    if (style && dataId) {
      itemStyles[dataId] = style;
    }
  });
  const demoStyles: Record<string, any> = {};
  const demos = document.querySelectorAll(".demo");
  demos.forEach((demo) => {
    const dataId = demo.getAttribute("data-id");
    const style = demo.getAttribute("style");
    if (style && dataId) {
      demoStyles[dataId] = style;
    }
  });
  const result = {
    inw,
    inh,
    itemStyles,
    demoStyles,
  };
  localStorage.setItem("attr", JSON.stringify(result));
}

// 监听元素变化
function observerDom() {
  const targetNodes = document.querySelectorAll(".dragArea_item");
  const observerOptions = {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    attributes: false, // 观察属性变动
    subtree: false, // 观察后代节点，默认为 false
  };
  const callback = debounce((mutationList: MutationRecord[]) => {
    mutationList.forEach((mutation) => {
      if (mutation.type === "childList") {
        setDemoPosition();
        operaHoriLine();
        operaVertLine();
        setTimeout(() => rememberAttr(), 1000)
      }
    });
  }, 20);
  targetNodes.forEach((node) => {
    const observer = new MutationObserver(callback);
    observer.observe(node, observerOptions);
  });
}

// 根据缓存排列demo顺序
function sortDemosByStorage() {
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  dragArea_items.forEach((item) => {
    const itemId = item.getAttribute("data-id") as string;
    const childId = item.getAttribute("data-child");
    const stoIds = localStorage.getItem(itemId);
    const resultIds = stoIds === null ? childId : stoIds;
    const ids = resultIds!.split("|");
    ids.forEach((id) => {
      const target = document.querySelector(`.demo[data-id="${id}"]`);
      target && item.appendChild(target);
    });
  });
}

// 初始化上下拖拽区域位置
export function initDragResizeArea() {
  sortDemosByStorage();
  initDragArea();
  initDemosPosition();
  operaHoriLine();
  operaVertLine();
  observerDom();
  window.addEventListener(
    "resize",
    debounce(() => {
      resizeUpdate();
      rememberAttr();
    }, 200)
  );
}

import { useChartInit } from "@/store/modules/chartInit";
import { useChartSub } from "@/store/modules/chartSub";
import { useStorage } from "@/store/modules/storage";
import { debounce } from "lodash";
import Sortable from "sortablejs";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();
const storageStore = useStorage();

const moving = {
  horizontalLine: false,
  verticalLine: false,
};
const iconHover = {
  horizontalLine: false,
  verticalLine: false,
};
const moveBtnMouseEnter = {
  horizontalLine: false,
  verticalLine: false,
};

const minWidth = 300;
const minHeight = 150;
const lineWidth = 8;
const dragAreaPadding = 8;
const lineColor = "rgba(206,205,209,1)";

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
        chartInitStore.saveCharts();
        const dragArea_items = document.querySelectorAll(".dragArea_item");
        const emptyChildItems = Array.from(dragArea_items).filter(
          (item) => item.querySelectorAll(".demo").length === 0
        );
        // 没有内容的区域初始化高度
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
      onMove: () => {
        setTimeout(() => {
          refreshLayout();
        }, 200);
      },
      onEnd: () => {
        setTimeout(() => {
          refreshLayout(); // fix：拖拽完剩一个拖拽层时样式不对
          chartInitStore.chartRefresh();
        }, 200);
      },
      store: {
        set: function (sortable: any) {
          const order = sortable.toArray();
          if (itemId) {
            storageStore.setItem(itemId, order.join("|"));
          }
        },
      },
    });
  }
  // 还原缓存的item样式
  const inw = window.innerWidth;
  const inh = window.innerHeight;
  const attr = storageStore.getItem("attr");
  let targetAttr = null;
  if (attr) {
    if (attr.inw === inw && attr.inh === inh) {
      targetAttr = attr;
    }
  }
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  if (targetAttr) {
    const itemStyles = targetAttr.itemStyles;
    dragArea_items.forEach((item) => {
      const itemId = item.getAttribute("data-id");
      if (itemId) {
        const style = itemStyles[itemId];
        item.setAttribute("style", style);
      }
    });
  } else {
    setDragAreaSize();
  }
}

// 拖拽区域大小 (dragArea_item高度)
function setDragAreaSize() {
  const dragArea = document.querySelector(".dragArea");
  if (dragArea) {
    const dh = dragArea.getBoundingClientRect().height;
    const dw = dragArea.getBoundingClientRect().width;
    const dragItems = document.querySelectorAll(".dragArea_item");

    // 先平分
    dragItems.forEach((item, index, arr) => {
      const height = dh / arr.length;
      item.setAttribute(
        "style",
        `height: ${height}px; width: ${dw}px; margin-top: ${
          index > 0 ? lineWidth : 0
        }px`
      );
    });

    // 裁剪高度
    let leftH = 0;
    dragItems.forEach((item) => {
      const element = item as HTMLElement;
      const nowH = item.getBoundingClientRect().height;
      const dlen = item.querySelectorAll(".demo").length;
      const initH = item.getAttribute("data-initH") || nowH;
      const needH = dlen === 0 ? 0 : +initH;
      // 需要的高度不等于 平分的高度，即有多出的高度
      if (needH !== nowH) {
        leftH += nowH - needH;
      }
      element.style.height = `${needH}px`;
    });

    // 把裁剪的高度分配
    const list = Array.from(dragItems).filter((item) => {
      const dlen = item.querySelectorAll(".demo").length;
      const initH = item.getAttribute("data-initH");
      return dlen > 0 && !initH;
    });

    let target;
    if (list.length) {
      target = list[0];
    } else {
      target = Array.from(dragItems).find(
        (e) => e.querySelectorAll(".demo").length > 0
      );
    }
    if (target) {
      const nowH = target.getBoundingClientRect().height;
      const ele = target as HTMLElement;
      ele.style.height = `${nowH + leftH}px`;
    }
  }
}

// 初始化demo宽高
function initDemosPosition() {
  // 还原缓存的demo样式
  const inw = window.innerWidth;
  const inh = window.innerHeight;
  const attr = storageStore.getItem("attr");
  let targetAttr = null;
  if (attr) {
    if (attr.inw === inw && attr.inh === inh) {
      targetAttr = attr;
    }
  }
  const demos = document.querySelectorAll(".demo");
  if (targetAttr) {
    const demoStyles = targetAttr.demoStyles;
    demos.forEach((item) => {
      const itemId = item.getAttribute("data-id");
      if (itemId) {
        const style = demoStyles[itemId];
        item.setAttribute("style", style);
      }
    });
  } else {
    setDemoPosition();
  }
}

// 定位demo的具体位置(widht, left)
function setDemoPosition() {
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  dragArea_items.forEach((item) => {
    const demos = item.querySelectorAll(".demo");
    // 减去padding
    const iw = item.getBoundingClientRect().width - dragAreaPadding * 2;

    // 先平分
    demos.forEach((demo, index, arr) => {
      const lineNum = arr.length - 1;
      const width = (iw - lineWidth * lineNum) / arr.length;
      demo.setAttribute("style", `width: ${width}px`);
    });

    // 裁剪宽度
    let leftW = 0;
    demos.forEach((demo, index, arr) => {
      const nowW = demo.getBoundingClientRect().width;
      const initW = demo.getAttribute("data-initW") || nowW;
      const needW = arr.length === 1 ? iw : +initW;
      if (needW !== nowW) {
        leftW += nowW - needW;
      }
      demo.setAttribute("style", `width: ${needW}px`);
    });

    // 分配裁剪宽度
    const list = Array.from(demos).filter((demo) => {
      const initW = demo.getAttribute("data-initW");
      return !initW;
    });
    const target = list.length ? list[0] : demos[0];
    if (target) {
      const nowW = target.getBoundingClientRect().width;
      target.setAttribute("style", `width: ${nowW + leftW}px`);
    }

    // 设置left
    demos.forEach((demo, index, arr) => {
      const element = demo as HTMLElement;
      if (index === 0) {
        element.style.left = `${dragAreaPadding}px`;
      } else {
        const right = arr[index - 1].getBoundingClientRect().right;
        element.style.left = `${right + lineWidth}px`;
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
    line.style.zIndex = "1";
    line.style.borderRadius = "2px";
    line.style.transition = "background-color 0.5s ease";
    line.style.backgroundClip = "content-box";
    line.style.padding = `0 ${dragAreaPadding}px`;

    const moveBtn = document.createElement("div");
    moveBtn.className = "horilineMoveBtn";
    moveBtn.style.width = `28px`;
    moveBtn.style.height = `${lineWidth}px`;
    moveBtn.style.backgroundSize = "28px 4px";
    moveBtn.style.backgroundRepeat = "no-repeat";
    moveBtn.style.backgroundPosition = "center";
    moveBtn.style.position = "absolute";
    moveBtn.style.top = "50%";
    moveBtn.style.left = "50%";
    moveBtn.style.transform = "translate(-50%, -50%)";
    moveBtn.style.zIndex = "2";
    moveBtn.style.transition = "all 0.3s ease";
    moveBtn.style.userSelect = "none";
    moveBtn.style.borderRadius = "2px";
    moveBtn.addEventListener("mouseover", function () {
      moveBtnMouseEnter.horizontalLine = true;
      iconHover.horizontalLine = true;
      moveBtn.style.padding = "4px 6px";
      moveBtn.style.backgroundColor = "rgba(232, 235, 240, 1)";
    });
    moveBtn.addEventListener("mouseout", function () {
      moveBtnMouseEnter.horizontalLine = false;
      if (moving.horizontalLine) {
        return;
      }
      moveBtn.style.backgroundColor = "";
      moveBtn.style.padding = "0";
      iconHover.horizontalLine = false;
    });
    moveBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    line.appendChild(moveBtn);

    line.addEventListener("mouseover", function () {
      if (iconHover.horizontalLine) {
        return;
      }
      line.style.backgroundColor = lineColor;
    });
    line.addEventListener("mouseout", function () {
      if (moving.horizontalLine) {
        return;
      }
      line.style.backgroundColor = "";
    });
    line.addEventListener("mousedown", (e) => {
      document
        .querySelectorAll(".resize_handler_horizontal")
        .forEach((item) => {
          (item as HTMLElement).style.display = "none";
        });
      moving.horizontalLine = true;
      startY = e.pageY;
      resizeVertical(e);
    });
    document.addEventListener("mouseup", function () {
      moving.horizontalLine = false;
      iconHover.horizontalLine = false;
      if (!moveBtnMouseEnter.horizontalLine) {
        moveBtn.style.backgroundColor = "";
        moveBtn.style.padding = "0";
      }
      document
        .querySelectorAll(".resize_handler_horizontal")
        .forEach((item) => {
          (item as HTMLElement).style.removeProperty("display");
        });
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
  const lineTarget = event.currentTarget as HTMLDivElement;
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
      const diff = nextDemoY - preDemoY;
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
    const mouseY = e.clientY - headerHight;
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
    line.style.zIndex = "1";
    line.style.transition = "background-color 0.5s ease";

    const moveBtn = document.createElement("div");
    moveBtn.className = "vertlineMoveBtn";
    moveBtn.style.width = `${lineWidth}px`;
    moveBtn.style.height = `28px`;
    moveBtn.style.backgroundSize = "4px 28px";
    moveBtn.style.backgroundRepeat = "no-repeat";
    moveBtn.style.backgroundPosition = "center";
    moveBtn.style.position = "absolute";
    moveBtn.style.top = "50%";
    moveBtn.style.left = "50%";
    moveBtn.style.transform = "translate(-50%, -50%)";
    moveBtn.style.zIndex = "2";
    moveBtn.style.transition = "all 0.3s ease";
    moveBtn.style.userSelect = "none";
    moveBtn.style.borderRadius = "2px";
    moveBtn.addEventListener("mouseover", function () {
      moveBtnMouseEnter.verticalLine = true;
      iconHover.verticalLine = true;
      moveBtn.style.padding = "6px 4px";
      moveBtn.style.backgroundColor = "rgba(232, 235, 240, 1)";
    });
    moveBtn.addEventListener("mouseout", function () {
      moveBtnMouseEnter.verticalLine = false;
      if (moving.verticalLine) {
        return;
      }
      moveBtn.style.backgroundColor = "";
      moveBtn.style.padding = "0";
      iconHover.verticalLine = false;
    });
    moveBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });

    line.appendChild(moveBtn);

    line.addEventListener("mouseover", function () {
      if (iconHover.verticalLine) {
        return;
      }
      line.style.backgroundColor = lineColor;
    });
    line.addEventListener("mouseout", function () {
      if (moving.verticalLine) {
        return;
      }
      line.style.backgroundColor = "";
    });
    document.addEventListener("mouseup", function () {
      moving.verticalLine = false;
      iconHover.verticalLine = false;
      if (!moveBtnMouseEnter.verticalLine) {
        moveBtn.style.backgroundColor = "";
        moveBtn.style.padding = "0";
      }
    });
    line.addEventListener("mousedown", (e) => {
      moving.verticalLine = true;
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
  const lineTarget = event.currentTarget as HTMLDivElement;
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
      const diff = nextDemoX - preDemoX;
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
    const lineLeft = clientX;
    const leftWidht = clientX - result[0].getBoundingClientRect().left;
    const rightWidht = result[1].getBoundingClientRect().right - clientX;
    if (leftWidht < minWidth || rightWidht < minWidth) {
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

// 根据当前比例进行缩放 dragitem
function resizeSetItem() {
  const dragArea = document.querySelector(".dragArea");
  const dragItems = document.querySelectorAll(".dragArea_item");
  if (dragArea === null) {
    return;
  }
  const dh = dragArea!.getBoundingClientRect().height;
  const dw = dragArea!.getBoundingClientRect().width;
  // 获取高度比例
  const heights = Array.from(dragItems).map((item) => {
    const demos = item.querySelectorAll(".demo");
    let height = minHeight;
    const ele = item as HTMLElement;
    const styleH = ele.style.height;
    if (styleH) {
      height = +styleH.replace("px", "");
    } else {
      height = item.getBoundingClientRect().height;
    }
    if (demos.length > 0 && height === 0) {
      const iniH = item.getAttribute("data-initH");
      height = iniH ? +iniH : minHeight;
    }
    if (demos.length === 0) {
      height = 0;
    }
    return height;
  });
  const totalHeight = heights.reduce((a, b) => a + b, 0);

  const heightRatios = heights.map((height) => height / totalHeight);

  dragItems.forEach((item, index) => {
    const element = item as HTMLElement;
    element.style.height = `${dh * heightRatios[index]}px`;
    element.style.width = `${dw}px`;
    element.style.marginTop = `${index > 0 ? lineWidth : 0}px`;
  });
}

// 根据当前比例进行缩放 demo
function resizeSetDemo() {
  const dragItems = document.querySelectorAll(".dragArea_item");
  dragItems.forEach((item) => {
    const demos = item.querySelectorAll(".demo");
    const itemW =
      item.getBoundingClientRect().width -
      dragAreaPadding * 2 -
      lineWidth * (demos.length - 1);
    const itemH = item.getBoundingClientRect().height;
    const widths = Array.from(demos).map((demo) => {
      const ele = demo as HTMLElement;
      const width = Math.floor(ele.getBoundingClientRect().width);
      return width;
    });
    const totalWidth = widths.reduce((a, b) => a + b, 0);
    const widthRatios = widths.map((width) => {
      const r = (width / totalWidth).toFixed(2);
      return parseFloat(r);
    });
    demos.forEach((demo, index) => {
      const element = demo as HTMLElement;
      element.style.width = `${widthRatios[index] * itemW}px`;
      element.style.height = `${itemH}px`;
      const left = index
        ? demos[index - 1].getBoundingClientRect().right + lineWidth
        : dragAreaPadding;
      element.style.left = `${left}px`;
    });
  });
}

export const refreshLayout = debounce(() => {
  setDragAreaSize();
  setDemoPosition();
  operaHoriLine();
  operaVertLine();
  rememberAttr();
}, 20);

export const resizeUpdate = debounce(() => {
  resizeSetItem();
  resizeSetDemo();
  operaHoriLine();
  operaVertLine();
  rememberAttr();
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
  storageStore.setItem("attr", result);
}

// 根据缓存排列demo顺序
function sortDemosByStorage() {
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  dragArea_items.forEach((item) => {
    const itemId = item.getAttribute("data-id");
    const childId = item.getAttribute("data-child");
    if (itemId) {
      const stoIds = storageStore.getItem(itemId);
      const resultIds = stoIds || childId;
      const ids = resultIds!.split("|");
      ids.forEach((id: any) => {
        const target = document.querySelector(`.demo[data-id="${id}"]`);
        target && item.appendChild(target);
      });
    }
  });
}

// 初始化上下拖拽区域位置
export function initDragResizeArea() {
  sortDemosByStorage();
  initDragArea();
  initDemosPosition();
  operaHoriLine();
  operaVertLine();
}

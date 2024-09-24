import Sortable from "sortablejs";
import { debounce } from "lodash";
import { useChartSub } from "@/store/modules/chartSub";
import { useChartInit } from "@/store/modules/chartInit";

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();

const moving = {
  horizontalLine: false,
  verticalLine: false,
};

const minWidth = 200;
const minHeight = 248;
const lineWidth = 5;
const lineColor = "#7cb305";

export function hideNoChildDragAreaItem() {
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  const noChildItems = Array.from(dragArea_items).filter(
    (item) => item.querySelectorAll(".demo").length === 0
  );
  if (noChildItems.length > 0) {
    dragArea_items.forEach((item) => {
      const element = item as HTMLDivElement;
      element.style.removeProperty("height");
    });
    noChildItems.forEach((item) => {
      const element = item as HTMLDivElement;
      element.style.height = "auto";
    });
  }
}

export function showNoChildDragAreaItem() {
  const dragArea_items = document.querySelectorAll(".dragArea_item");
  dragArea_items.forEach((item) => {
    const element = item as HTMLDivElement;
    element.style.removeProperty("height");
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
    line.style.width = window.innerWidth + "px";
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
      resizeVertical(e);
    });
    document.querySelector(".main")?.appendChild(line);
  }
}

// 更新水平线位置
function updateHoriLine() {
  let count = 0;
  const dragArea_items = document.querySelectorAll(
    ".dragArea_item"
  ) as NodeListOf<Element>;
  const vertLine = document.querySelectorAll(
    ".resize_handler_vertical"
  ) as NodeListOf<HTMLElement>;
  dragArea_items.forEach((item, index, arr) => {
    if (index > 0) {
      const style = item.getBoundingClientRect();
      vertLine[count].style.top = `${style.top - lineWidth}px`;
      count++;
    }
  });
}

// 水平线垂直拉伸
const resizeVertical = (event: MouseEvent) => {
  chartSubStore.chartsLoading = true;
  const lineTarget = event.target as HTMLDivElement;
  const lineX = lineTarget.getBoundingClientRect().x;

  const dragArea_items: NodeListOf<Element> =
    document.querySelectorAll(".dragArea_item");
  const sameXItems = Array.from(dragArea_items).filter((item) => {
    const itemX = item.getBoundingClientRect().x;
    const epsilon = 3;
    return Math.abs(itemX - lineX) < epsilon;
  });
  // 查找线两边的demo
  let upDom: HTMLDivElement | null = null;
  let downDom: HTMLDivElement | null = null;

  let minDiff = window.innerHeight;
  const lineY = lineTarget.getBoundingClientRect().y;
  const compareY = lineY + lineWidth / 2;
  for (let i = 0; i < sameXItems.length - 1; i++) {
    const preDemoY = sameXItems[i].getBoundingClientRect().y;
    const nextDemoY = sameXItems[i + 1].getBoundingClientRect().y;
    if (preDemoY < compareY && nextDemoY > compareY) {
      let diff = nextDemoY - preDemoY;
      if (diff < minDiff) {
        minDiff = diff;
        upDom = sameXItems[i] as HTMLDivElement;
        downDom = sameXItems[i + 1] as HTMLDivElement;
      }
    }
  }

  let upMinH = minHeight;
  let upDomHeight = 0;
  let downMinH = minHeight;
  let downDomHeight = 0;
  if (upDom) {
    upMinH = Number(upDom.getAttribute("data-minHeight") || minHeight);
    upDomHeight = upDom.getBoundingClientRect().height;
  }
  if (downDom) {
    downMinH = Number(downDom.getAttribute("data-minHeight") || minHeight);
    downDomHeight = downDom.getBoundingClientRect().height;
  }

  const startClientY = lineTarget.getBoundingClientRect().top;
  function resize({ clientY }: MouseEvent) {
    const movePx = clientY - startClientY;

    const upNowHeight = upDomHeight + movePx;
    if (movePx < 0 && upNowHeight < upMinH) {
      return;
    }
    const downNowHeight = downDomHeight - movePx;
    if (movePx > 0 && downNowHeight < downMinH) {
      return;
    }

    if (upDom) {
      upDom.style.height = `${upNowHeight}px`;
    }
    if (downDom) {
      downDom.style.height = `${downNowHeight}px`;
    }
    lineTarget.style.top = `${clientY}px`;
  }
  function stopResize() {
    chartSubStore.chartsLoading = false;
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
  const horiLines = document.querySelectorAll(".resize_handler_vertical");
  // 新增
  if (horiLines.length < dragArea_items.length - 1) {
    createHoriLine(dragArea_items.length - 1);
  }
  // 删除
  if (horiLines.length > dragArea_items.length - 1) {
    delHoriLine(horiLines.length - dragArea_items.length + 1);
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
      moving.horizontalLine = false;
    });
    line.addEventListener("mousedown", (e) => {
      moving.horizontalLine = true;
      resizeHorizontal(e);
    });
    document.querySelector(".main")?.appendChild(line);
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
  let count = 0;
  const vertLines = document.querySelectorAll(
    ".resize_handler_horizontal"
  ) as NodeListOf<HTMLElement>;
  const dragArea_items = document.querySelectorAll(
    ".dragArea_item"
  ) as NodeListOf<Element>;
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
        vertLines[count].style.top = `${y}px`;
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
  const demos = document.querySelectorAll(".demo");
  const lineTarget = event.target as HTMLDivElement;
  const startClientX = lineTarget.getBoundingClientRect().left;
  const lineY = lineTarget.getBoundingClientRect().y;

  // 跟线在同一层的demo
  const sameYDemos = Array.from(demos).filter((item) => {
    const itemY = item.getBoundingClientRect().y;
    // 使用一个误差范围来比较浮点数
    const epsilon = 3;
    return Math.abs(itemY - lineY) < epsilon;
  });

  // 查找线两边的demo
  let leftDom: HTMLDivElement;
  let rightDom: HTMLDivElement;

  let minDiff = window.innerWidth;
  const lineX = lineTarget.getBoundingClientRect().x;
  for (let i = 0; i < sameYDemos.length - 1; i++) {
    const preDemoX = sameYDemos[i].getBoundingClientRect().x;
    const nextDemoX = sameYDemos[i + 1].getBoundingClientRect().x;
    if (preDemoX < lineX && nextDemoX > lineX) {
      let diff = nextDemoX - preDemoX;
      if (diff < minDiff) {
        minDiff = diff;
        leftDom = sameYDemos[i] as HTMLDivElement;
        rightDom = sameYDemos[i + 1] as HTMLDivElement;
      }
    }
  }

  const leftMinW = Number(leftDom!.getAttribute("data-minWidth") || minWidth);
  const leftDomWidth = leftDom!.getBoundingClientRect().width;
  const rightMinW = Number(rightDom!.getAttribute("data-minWidth") || minWidth);
  const rightDomWidth = rightDom!.getBoundingClientRect().width;

  function resize({ clientX }: MouseEvent) {
    const movePx = clientX - startClientX;

    const leftNowWidth = leftDomWidth + movePx;
    if (movePx < 0 && leftNowWidth < leftMinW) {
      return;
    }

    const rightNowWidth = rightDomWidth - movePx;
    if (movePx > 0 && rightNowWidth < rightMinW) {
      return;
    }

    leftDom.style.width = `${leftNowWidth}px`;
    rightDom.style.width = `${rightNowWidth}px`;
    lineTarget.style.left = `${clientX}px`;
  }

  function stopResize() {
    chartSubStore.chartsLoading = false;
    document.removeEventListener("mousemove", resize);
    document.removeEventListener("mouseup", stopResize);
    updateVertLine();
  }
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResize);
}

function resetArea() {
  const demos = document.querySelectorAll(".demo");
  demos.forEach((item) => {
    const element = item as HTMLDivElement;
    const ew = element.getBoundingClientRect().width;
    element.style.width = `${ew}px`;
    element.style.removeProperty("flex");
  });
}

// 增加拖拽实例
function createSortable() {
  const nestedSortables = [].slice.call(
    document.querySelectorAll(".nested-sortable")
  );
  for (let i = 0; i < nestedSortables.length; i++) {
    new Sortable(nestedSortables[i], {
      group: "nested",
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 1,
      handle: ".handle",
      // store: {
      //   get: function (sortable: any) {
      //     const order = localStorage.getItem(sortable.options.group.name);
      //     return order ? order.split("|") : [];
      //   },
      //   set: function (sortable: any) {
      //     const order = sortable.toArray();
      //     localStorage.setItem(sortable.options.group.name, order.join("|"));
      //   },
      // },
      onStart: (evt: any) => {
        evt.item.querySelector(".container_item").style.display = "none";
        evt.item.style.border = "1px dashed #E28602";
        showNoChildDragAreaItem();
      },
      onEnd: (evt: any) =>
        setTimeout(() => {
          evt.item.style.removeProperty("border");
          evt.item.querySelector(".container_item").style.display = "";
          const maxWidth = window.innerWidth;
          document.querySelectorAll(".dragArea_item").forEach((item) => {
            let sumWidth = 0;
            item.querySelectorAll(".demo").forEach((demo) => {
              sumWidth += demo.getBoundingClientRect().width;
            });
            if (sumWidth > maxWidth) {
              item.querySelectorAll(".demo").forEach((demo, index, demos) => {
                const element = demo as HTMLDivElement;
                element.style.width =
                  maxWidth / demos.length -
                  (demos.length - 1) * lineWidth +
                  "px";
              });
            }
          });
          hideNoChildDragAreaItem();
          operaVertLine();
          operaHoriLine();
          // 图表区域会因为拖拽重新初始化，需要重新更新图表最新的状态
          chartInitStore.syncSetChart();
        }, 200),
    });
  }
}

function observerDom() {
  const targetNodes = document.querySelectorAll(".dragArea_item");
  const observer = new ResizeObserver(
    () => {
      updateVertLine();
      updateHoriLine();
    }
  );
  targetNodes.forEach((item) => {
    observer.observe(item);
  });

  const observerOptions = {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: false, // 观察后代节点，默认为 false
  };
  function callback(
    mutationList: MutationRecord[],
    observer: MutationObserver
  ) {
    mutationList.forEach((mutation) => {
      if (mutation.type === "childList") {
        operaHoriLine();
        operaVertLine();
      }
    });
  }
  targetNodes.forEach((node) => {
    const observer = new MutationObserver(callback);
    observer.observe(node, observerOptions);
  });
}

export function initDragResize() {
  createSortable();
  resetArea();
  operaHoriLine();
  operaVertLine();
  observerDom();
  window.addEventListener(
    "resize",
    debounce(() => {
      updateVertLine();
      updateHoriLine();
    }, 20)
  );

  // 记忆
  // document.querySelectorAll(".dragArea_item");
  // const demos = document.querySelectorAll(".demo");
}

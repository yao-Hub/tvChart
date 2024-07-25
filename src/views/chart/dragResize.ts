import { debounce } from 'lodash';
import Sortable from 'sortablejs';
import { useChartSub } from '@/store/modules/chartSub';
import { useChartInit } from '@/store/modules/chartInit';

const chartInitStore = useChartInit();
const chartSubStore = useChartSub();

const moving = {
  horizontalLine: false,
  verticalLine: false
};

const minWidht = 200;
const minHeight = 150;

// 水平线初始拉伸位置
let startY: number;

// Sortable实例化集合
let dragList: Record<string, any> = {};

const dragOption = {
  group: 'dragItem',
  animation: 150,
  handle: '.handle',
  swapThreshold: 0.65,
  onEnd: () => dragOnEnd(),
  onStart: (evt: any) => dragOnStart(evt),
};

// 增加拖拽区域
function createDragAreaItem(parentDom: Element, position: 'down' | 'up') {
  function findMissingNumber(nums: number[]) {
    const arr = nums.sort();
    let expectedNum = 1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === expectedNum) {
        expectedNum++;
      } else if (arr[i] > expectedNum) {
        return expectedNum;
      }
    }
    return expectedNum;
  }

  const items = document.querySelectorAll('.dragArea_item');
  const dragIds = Array.from(items).map(item => {
    const dragId = item.getAttribute('grag_id');
    const num = dragId?.split('_')[1];
    return num ? +num : 0;
  });
  const targetDragId = findMissingNumber(dragIds);
  const dragIdName = `grag_${targetDragId}`;

  const drag = document.createElement("div");
  drag.className = 'dragArea_item';
  drag.style.position = "relative";
  drag.style.width = "100%";
  drag.style.boxSizing = "border-box";
  drag.setAttribute('grag_id', dragIdName);
  if (position === 'down') {
    parentDom.parentNode?.insertBefore(drag, parentDom.nextSibling);
  }
  if (position === 'up') {
    parentDom.parentNode?.insertBefore(drag, parentDom.parentNode.firstChild);
  }
  if (!dragList.hasOwnProperty(dragIdName)) {
    dragList[dragIdName] = new Sortable(drag, dragOption);
  }
  dragList[dragIdName].option('disabled', false);
  resizeUpdate();
};

// 拖拽增加拖拽区域
function dragOnStart(evt: any) {
  const demosNum = document.querySelectorAll('.demo').length;
  const fromDom = evt.from as Element;
  const fromDomTop = fromDom.getBoundingClientRect().y;
  const fromDomBottom = fromDom.getBoundingClientRect().bottom;
  const fromDomDemos = fromDom.querySelectorAll('.demo').length;

  evt.item.ondrag = (e: MouseEvent) => {
    const itemsNum = document.querySelectorAll('.dragArea_item').length;
    if (demosNum === itemsNum || fromDomDemos <= 1) {
      return;
    }
    // 鼠标位置
    const y = e.clientY;
    if (y > (fromDomBottom + fromDomTop) / 2) {
      createDragAreaItem(fromDom, 'down');
    }
    if (y < fromDomTop) {
      createDragAreaItem(fromDom, 'up');
    }
  };
  chartInitStore.setCacheSymbol();
};

function dragOnEnd() {
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const emptyChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length === 0);
  emptyChildItems.forEach(item => {
    const gragId = item.getAttribute('grag_id');
    if (gragId) {
      dragList[gragId].option('disabled', true);
      delete dragList[gragId];
    }
    item.remove();
  });
  resizeUpdate();
  setTimeout(() => {
    chartInitStore.setChartSymbolWithCache();
  });
};

// 初始化拖拽实例
function initDragArea() {
  const dragItem = [].slice.call(document.querySelectorAll('.dragArea_item'));
  for (var i = 0; i < dragItem.length; i++) {
    const item = dragItem[i] as HTMLElement;
    item.setAttribute('grag_id', `grag_${i}`);
    dragList[`grag_${i}`] = new Sortable(dragItem[i], dragOption);
  }
};

// 拖拽区域大小
function setDragAreaSize(setEmptyChild?: boolean) {
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  function setSize(arr: NodeListOf<Element> | Element[]) {
    arr.forEach((item, index, arr) => {
      const element = item as HTMLElement;
      element.style.height = dragArea.getBoundingClientRect().height / arr.length - 1.5 * (arr.length - 1) + 'px';
      if (index > 0) {
        element.style.marginTop = '3px';
      }
    });
  }
  if (setEmptyChild) {
    const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
    const emptyChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length === 0);
    emptyChildItems.forEach(item => {
      const element = item as HTMLElement;
      element.style.height = '0';
    });
    setSize(haveChildItems);
  } else {
    setSize(dragArea_items);
  }
};

function setDemoPosition() {
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  dragArea_items.forEach(item => {
    const demos = item.querySelectorAll('.demo') as NodeListOf<HTMLElement>;
    demos.forEach((demo, index) => {
      const element = demo as HTMLElement;
      element.style.width = dragArea.getBoundingClientRect().width / demos.length - (demos.length) + 'px';
      element.style.height = item.getBoundingClientRect().height + 'px';
      element.style.top = '0';
      if (index === 0) {
        element.style.left = '0';
      } else {
        element.style.left = (dragArea.getBoundingClientRect().width / demos.length + 1) * index + 'px';
      }
    });
  });
};

// 增加水平线
function createHoriLine(addNum: number) {
  for (let index = 0; index < addNum; index++) {
    const line = document.createElement("div");
    line.className = 'resize_handler_vertical';
    line.style.position = "absolute";
    line.style.height = "3px";
    line.style.cursor = "ns-resize";
    line.style.left = "0";
    line.style.top = "0";
    line.addEventListener("mouseover", function () {
      line.style.backgroundColor = "#7cb305";
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
      document.querySelectorAll('.resize_handler_horizontal').forEach(item => {
        (item as HTMLElement).style.removeProperty('display');
      });
    });
    line.addEventListener("mousedown", (e) => {
      document.querySelectorAll('.resize_handler_horizontal').forEach(item => {
        (item as HTMLElement).style.display = 'none';
      });
      moving.verticalLine = true;
      startY = e.pageY;
      resizeVertical(e);
    });
    document.querySelector('.dragArea')?.appendChild(line);
  }
};

// 水平线位置
function updateHoriLine() {
  let count = 0;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
  const vertLine = document.querySelectorAll('.resize_handler_vertical') as NodeListOf<HTMLElement>;
  haveChildItems.forEach((item, index, arr) => {
    if (index > 0) {
      const element = arr[index - 1] as HTMLElement;
      vertLine[count].style.top = `${element.getBoundingClientRect().bottom - 50}px`;
      vertLine[count].style.width = element.getBoundingClientRect().width + 'px';
      count++;
    }
  });
};

// 水平线垂直拉伸
const resizeVertical = (event: MouseEvent) => {
  chartSubStore.chartLoading = true;
  let result: HTMLDivElement[] = [];

  const lineTarget = event.target as HTMLDivElement;
  const lineX = lineTarget.getBoundingClientRect().x;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
  const sameXItems = haveChildItems.filter(item => {
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
        result = [sameXItems[i] as HTMLDivElement, sameXItems[i + 1] as HTMLDivElement];
      }
    }
  }
  const result_0_height = result[0].getBoundingClientRect().height;
  const result_1_height = result[1].getBoundingClientRect().height;
  function resize(e: MouseEvent) {
    let mouseY = e.clientY - 50;
    const offset = e.pageY - startY;
    const topHeight = result_0_height + offset;
    const downHeight = result_1_height - offset;
    if (topHeight < minHeight || downHeight < minHeight) {
      return;
    }
    lineTarget.style.top = `${mouseY - 1.5}px`;
    result[0].style.height = `${topHeight}px`;
    result[0].querySelectorAll('.demo').forEach(item => (item as HTMLElement).style.height = `${topHeight}px`);
    result[1].style.height = `${downHeight}px`;
    result[1].querySelectorAll('.demo').forEach(item => (item as HTMLElement).style.height = `${downHeight}px`);
  }
  function stopResize() {
    chartSubStore.chartLoading = false;
    updateVertLine();
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

// 删除水平线
function delHoriLine(delNum: number) {
  let count = delNum;
  const horiLines = document.querySelectorAll('.resize_handler_vertical');
  horiLines.forEach(item => {
    if (count > 0) {
      item.remove();
      count--;
    }
  });
};

// 水平线curd
function operaHoriLine() {
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
  const horiLines = document.querySelectorAll('.resize_handler_vertical');
  // 新增
  if (horiLines.length < haveChildItems.length - 1) {
    createHoriLine(haveChildItems.length - 1);
  }
  // 删除
  if (horiLines.length > haveChildItems.length - 1) {
    delHoriLine(horiLines.length - haveChildItems.length + 1);
  }
  updateHoriLine();
};

// 增加竖直线
function createVertLine(addNum: number) {
  for (let index = 0; index < addNum; index++) {
    const line = document.createElement("div");
    line.className = 'resize_handler_horizontal';
    line.style.position = "absolute";
    line.style.width = "3px";
    line.style.cursor = "ew-resize";
    line.style.zIndex = '99';
    line.addEventListener("mouseover", function () {
      line.style.backgroundColor = "#7cb305";
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
    document.querySelector('.dragArea')?.appendChild(line);
  }
};

// 删除竖直线
function delVertLine(delNum: number) {
  let count = delNum;
  const vertLines = document.querySelectorAll('.resize_handler_horizontal');
  vertLines.forEach(item => {
    if (count > 0) {
      item.remove();
      count--;
    }
  });
};

// 更新竖直线的位置
function updateVertLine() {
  let count = 0;
  const vertLines = document.querySelectorAll('.resize_handler_horizontal') as NodeListOf<HTMLElement>;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
  haveChildItems.forEach(item => {
    const demos = item.querySelectorAll('.demo');
    demos.forEach((demo, index) => {
      if (index > 0) {
        const x = demo.getBoundingClientRect().x;
        const height = demo.getBoundingClientRect().height;
        const y = demo.getBoundingClientRect().y;
        vertLines[count].style.top = `${y - 50}px`;
        vertLines[count].style.height = `${height}px`;
        vertLines[count].style.left = `${x - 3}px`;
        count++;
      }
    });
  });
};

// 竖直线curd
function operaVertLine() {
  let lineCount = 0;
  const dragArea_items = document.querySelectorAll('.dragArea_item') as NodeListOf<Element>;
  const haveChildItems = Array.from(dragArea_items).filter(item => item.querySelectorAll('.demo').length !== 0);
  haveChildItems.forEach(item => {
    const demos = item.querySelectorAll('.demo');
    const needLineCount = demos.length > 1 ? demos.length - 1 : 0;
    lineCount += needLineCount;
  });
  const vertLines = document.querySelectorAll('.resize_handler_horizontal');
  // 新增
  if (vertLines.length < lineCount) {
    createVertLine(lineCount - vertLines.length);
  }
  // 删除
  if (vertLines.length > lineCount) {
    delVertLine(vertLines.length - lineCount);
  }
  updateVertLine();
};

// 竖直线水平拉伸
function resizeHorizontal(event: MouseEvent) {
  chartSubStore.chartLoading = true;
  let result: HTMLDivElement[] = [];
  const demos = document.querySelectorAll('.demo');
  const lineTarget = event.target as HTMLDivElement;
  const lineY = lineTarget.getBoundingClientRect().y;
  // 跟线在同一层的demo
  const sameYDemos = Array.from(demos).filter(item => {
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
        result = [sameYDemos[i] as HTMLDivElement, sameYDemos[i + 1] as HTMLDivElement];
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
    result[1].style.width = `${rightWidht - 3}px`;
    result[1].style.left = `${lineLeft + 3}px`;
    lineTarget.style.left = `${lineLeft}px`;
  }

  function stopResize() {
    chartSubStore.chartLoading = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

const debounceUpdateLayout = debounce(() => {
  setDemoPosition();
  operaHoriLine();
  operaVertLine();
}, 20);

export const resizeUpdate = debounce((layoutOpera?: boolean) => {
  setDragAreaSize(layoutOpera);
  setDemoPosition();
  operaHoriLine();
  operaVertLine();
}, 20);

// 监听元素变化
function observerDom() {
  const targetNodes = document.querySelectorAll('.dragArea_item');
  const observerOptions = {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    attributes: false, // 观察属性变动
    subtree: false, // 观察后代节点，默认为 false
  };
  function callback(mutationList: MutationRecord[], observer: MutationObserver) {
    mutationList.forEach((mutation) => {
      if (mutation.type === 'childList') {
        debounceUpdateLayout();
      }
    });
  }
  targetNodes.forEach(node => {
    const observer = new MutationObserver(callback);
    observer.observe(node, observerOptions);
  });
}

// 初始化上下拖拽区域位置
export function initDragResizeArea() {
  initDragArea();
  setDragAreaSize();
  setDemoPosition();
  operaHoriLine();
  operaVertLine();
  observerDom();
  window.addEventListener('resize', () => resizeUpdate());
};
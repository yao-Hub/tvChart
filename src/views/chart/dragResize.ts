import { debounce } from 'lodash';
import Sortable from 'sortablejs';
import { useChartSub } from '@/store/modules/chartSub';
const chartSubStore = useChartSub();

export function backInitArea() {
  const demos = document.querySelectorAll('.demo');
  const items = Array.from(document.querySelectorAll('.dragArea_item'));
  const ifZeroHeight = items.some(item => item.getBoundingClientRect().height === 0);
  if (ifZeroHeight) {
    items.forEach(item => {
      const element = item as HTMLElement;
      if (element.querySelectorAll('.demo').length === 0) {
        element.style.height = '300px';
      }
      if (element.querySelectorAll('.demo').length !== 0 && item.getBoundingClientRect().height === 0) {
        element.style.height = '300px';
      }
      if (element.querySelectorAll('.demo').length === demos.length) {
        element.style.height = element.getBoundingClientRect().height - 300 + 'px';
      }
    });
    debounceUpdateLayout();
  }
};

export function fullArea() {
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const items = Array.from(document.querySelectorAll('.dragArea_item'));
  const demos = document.querySelectorAll('.demo');
  const ifEmptyChild = items.some(item => item.querySelectorAll('.demo').length === 0);
  if (ifEmptyChild) {
    items.forEach(item => {
      const element = item as HTMLElement;
      if (element.querySelectorAll('.demo').length === demos.length) {
        element.style.height = dragArea.getBoundingClientRect().height - 3 + 'px';
      }
      if (element.querySelectorAll('.demo').length === 0) {
        element.style.height = '0';
      }
    });
    debounceUpdateLayout();
  }
};

// 拖拽区域
function createDragArea() {
  var nestedSortables = [].slice.call(document.querySelectorAll('.dragArea_item'));
  for (var i = 0; i < nestedSortables.length; i++) {
    new Sortable(nestedSortables[i], {
      group: 'nested',
      animation: 150,
      handle: '.handle',
      fallbackOnBody: true,
      onStart: backInitArea,
      onEnd: fullArea
    });
  }
};

function initDragAreaPosition() {
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;
  dragArea_item_top.style.height = dragArea.getBoundingClientRect().height / 2 - 1.5 + 'px';
  dragArea_item_down.style.height = dragArea.getBoundingClientRect().height / 2 - 1.5 + 'px';
  dragArea_item_down.style.marginTop = '3px';
}

export function setDemoPosition() {
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;
  const topDemos = dragArea_item_top.querySelectorAll('.demo') as NodeListOf<HTMLElement>;
  const downDemos = dragArea_item_down.querySelectorAll('.demo') as NodeListOf<HTMLElement>;
  topDemos.forEach((item, index) => {
    item.style.width = dragArea.getBoundingClientRect().width / topDemos.length - (topDemos.length) + 'px';
    item.style.height = dragArea_item_top.getBoundingClientRect().height + 'px';
    item.style.top = '0';
    if (index === 0) {
      item.style.left = '0';
    } else {
      item.style.left = (dragArea.getBoundingClientRect().width / topDemos.length + 1) * index + 'px';
    }
  });
  downDemos.forEach((item, index) => {
    item.style.width = dragArea.getBoundingClientRect().width / downDemos.length - (topDemos.length) + 'px';
    item.style.height = dragArea_item_down.getBoundingClientRect().height + 'px';
    item.style.top = '0';
    if (index === 0) {
      item.style.left = '0';
    } else {
      item.style.left = (dragArea.getBoundingClientRect().width / downDemos.length + 1) * index + 'px';
    }
  });
};

// 增加水平线
function createHoriLine() {
  const line = document.createElement("div");
  line.className = 'resize_handler_vertical';
  line.style.position = "absolute";
  line.style.height = "3px";
  line.style.cursor = "row-resize";
  line.style.left = "0";
  line.addEventListener("mouseover", function () {
    line.style.backgroundColor = "#7cb305";
  });
  line.addEventListener("mouseout", function () {
    line.style.backgroundColor = "";
  });
  line.addEventListener("mousedown", resizeVertical);
  document.querySelector('.dragArea')?.appendChild(line);
  updateHoriLine();
};

// 水平线位置
function updateHoriLine() {
  const line = document.querySelector('.resize_handler_vertical') as HTMLElement;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  line.style.top = dragArea_item_top.getBoundingClientRect().height + 'px';
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  line.style.width = dragArea.getBoundingClientRect().width + 'px';
};

// 垂直拉伸
const resizeVertical = () => {
  chartSubStore.chartLoading = true;
  const dragArea = document.querySelector('.dragArea') as HTMLElement;
  const top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const down = document.querySelector('.dragArea_item_down') as HTMLElement;
  const resizeLine = document.querySelector('.resize_handler_vertical') as HTMLElement;
  function resize(e: MouseEvent) {
    const containerRect = top.getBoundingClientRect();
    let mouseY = e.clientY - containerRect.top;
    if (mouseY < 0) {
      mouseY = 0;
    }
    if (mouseY > dragArea.getBoundingClientRect().height) {
      mouseY = dragArea.getBoundingClientRect().height - 3;
    }
    resizeLine.style.top = `${mouseY}px`;

    top.style.height = `${mouseY}px`;
    top.querySelectorAll('.demo').forEach(item => (item as HTMLElement).style.height = `${mouseY}px`);

    down.style.height = `${dragArea.getBoundingClientRect().height - mouseY - 3}px`;
    down.querySelectorAll('.demo').forEach(item => (item as HTMLElement).style.height = `${dragArea.getBoundingClientRect().height - mouseY - 3}px`);
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

// 水平拉伸
function resizeHorizontal(event: MouseEvent) {
  let result: HTMLDivElement[] = [];
  const demos = document.querySelectorAll('.demo');
  const target = event.target as HTMLDivElement;
  const lineY = target.getBoundingClientRect().y;
  // 跟线在同一层的demo
  const sameYDemos = Array.from(demos).filter(item => {
    const itemY = item.getBoundingClientRect().y;
    // 使用一个误差范围来比较浮点数
    const epsilon = 3;
    return Math.abs(itemY - lineY) < epsilon;
  });
  // 查找线两边的demo
  let minDiff = window.innerWidth;
  const lineX = target.getBoundingClientRect().x;
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
  const result_0_left = result[0].getBoundingClientRect().left;
  const relust_1_right = result[1].getBoundingClientRect().right;
  function resize({ clientX }: MouseEvent) {
    chartSubStore.chartLoading = true;
    let leftWidht = clientX - result_0_left;
    let rightWidht = relust_1_right - clientX;
    let lineLeft = clientX - 1;
    if (leftWidht < 200) {
      leftWidht = 200;
      lineLeft = result[0].getBoundingClientRect().right + 3;
    }
    if (rightWidht < 200) {
      rightWidht = 200;
      lineLeft = result[1].getBoundingClientRect().left - 3;
    }
    result[0].style.width = `${leftWidht}px`;
    result[1].style.width = `${rightWidht - 3}px`;
    result[1].style.left = `${lineLeft + 4}px`;
    target.style.left = `${lineLeft}px`;
  }

  function stopResize() {
    chartSubStore.chartLoading = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
  document.addEventListener('mousemove', resize);
  document.addEventListener('mouseup', stopResize);
};

// 增加竖直线
function createVertLine(addNum: number) {
  for (let index = 0; index < addNum; index++) {
    const line = document.createElement("div");
    line.className = 'resize_handler_horizontal';
    line.style.position = "absolute";
    line.style.width = "3px";
    line.style.cursor = "col-resize";
    line.style.zIndex = '99';
    line.addEventListener("mouseover", function () {
      line.style.backgroundColor = "#7cb305";
    });
    line.addEventListener("mouseout", function () {
      line.style.backgroundColor = "";
    });
    line.addEventListener("mousedown", resizeHorizontal);
    document.querySelector('.dragArea')?.appendChild(line);
  }
};

// 删除竖直线
function delVertLine(delNum: number) {
  let count = delNum;
  const horiLines = document.querySelectorAll('.resize_handler_horizontal');
  horiLines.forEach(item => {
    if (count > 0) {
      item.remove();
      count--;
    }
  });
};

// 更新竖直线的位置
async function updateVertLine() {
  let count = 0;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;
  const topDemo = dragArea_item_top.querySelectorAll('.demo');
  const downDemo = dragArea_item_down.querySelectorAll('.demo');
  const horiLines = document.querySelectorAll('.resize_handler_horizontal') as NodeListOf<HTMLElement>;
  topDemo.forEach((item, index) => {
    if (index > 0) {
      const x = item.getBoundingClientRect().x;
      const height = item.getBoundingClientRect().height;
      const y = item.getBoundingClientRect().y;
      horiLines[count].style.top = `${y - 50}px`;
      horiLines[count].style.height = `${height}px`;
      horiLines[count].style.left = `${x - 4}px`;
      count++;
    }
  });
  downDemo.forEach((item, index) => {
    if (index > 0) {
      const x = item.getBoundingClientRect().x;
      const height = item.getBoundingClientRect().height;
      const y = item.getBoundingClientRect().y;
      horiLines[count].style.top = `${y - 50}px`;
      horiLines[count].style.height = `${height}px`;
      horiLines[count].style.left = `${x - 4}px`;
      count++;
    }
  });
};

// 竖直线curd
function operaVertLine() {
  let topAreaLineCount = 0;
  let downAreaLineCount = 0;
  let lineCount = 0;
  const dragArea_item_top = document.querySelector('.dragArea_item_top') as HTMLElement;
  const dragArea_item_down = document.querySelector('.dragArea_item_down') as HTMLElement;

  const topDemoList = dragArea_item_top.querySelectorAll('.demo');
  const downDemoList = dragArea_item_down.querySelectorAll('.demo');

  topAreaLineCount = topDemoList.length > 1 ? topDemoList.length - 1 : 0;
  downAreaLineCount = downDemoList.length > 1 ? downDemoList.length - 1 : 0;
  lineCount = topAreaLineCount + downAreaLineCount;

  const horiLines = document.querySelectorAll('.resize_handler_horizontal');
  // 新增
  if (horiLines.length < lineCount) {
    createVertLine(lineCount - horiLines.length);
  }
  // 删除
  if (horiLines.length > lineCount) {
    delVertLine(horiLines.length - lineCount);
  }
  updateVertLine();
};

const debounceUpdateLayout = debounce(() => {
  setDemoPosition();
  updateHoriLine();
  operaVertLine();
}, 20);

const resizeUpdate = debounce(() => {
  initDragAreaPosition();
  setDemoPosition();
  updateHoriLine();
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
  initDragAreaPosition();
  createDragArea();
  createHoriLine();
  setDemoPosition();
  operaVertLine();
  observerDom();
  window.addEventListener('resize', resizeUpdate);
};
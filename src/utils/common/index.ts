// 保留有效小数
export function round(number: number, precision: number) {
  // return Math.round(+number + "e" + precision) / Math.pow(10, precision);
  //same as:
  // const roundedNumber = Number(Math.round(+number + "e" + precision) + "e-" + precision);
  const roundedNumber = Number(
    Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision)
  );
  return roundedNumber.toFixed(precision);
}

/**
 * @param {Object} lists 所有数据 数组对象
 * @param {string} keyWord 查询的关键词
 * @param {string} key 指定查询lists字段
 */
export function selectMatchItem(
  lists: Array<any>,
  keyWord: string,
  key?: string
) {
  let reg = new RegExp(keyWord, "i");
  let resArr: any = [];
  lists.forEach((item) => {
    if (key) {
      if (reg.test(item[key])) {
        resArr.push(item);
      }
    } else {
      for (let i in item) {
        if (reg.test(item[i])) {
          resArr.push(item);
          break;
        }
      }
    }
  });
  return resArr;
}

export function ifNumber(value?: string): boolean {
  if (value === undefined || value === "") {
    return false;
  }
  return !isNaN(Number(value));
}

// 限制小数位数
export function limitdigit(value: string | number, digits: number) {
  const regex = new RegExp(`^\\d*(\\.\\d{0,${digits}})?$`);
  const str = String(value);
  if (!regex.test(str)) {
    return str
      .replace(/[^0-9.]/g, "") // 移除非法字符
      .replace(/(\..*?)\..*/g, "$1") // 只保留第一个小数点
      .replace(new RegExp(`^(\\d+)(\\.\\d{${digits}}).*`), "$1$2");
  }
  return value;
}

export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getPort(url: string) {
  const match = url.match(/:\d+(\/|$)/);
  if (match) {
    const port = match[0].slice(1);
    return port;
  }
  return "";
}

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

type ThrottledFunction<T extends any[]> = {
  (...args: T): void;
  cancel: () => void;
};

export function throttle<T extends any[]>(
  func: (...args: T) => void,
  wait: number,
  options: ThrottleOptions = { leading: true, trailing: true }
): ThrottledFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastTriggerTime: number = 0;
  let context: any;
  let args: T | null;

  // 延迟执行函数（核心逻辑）
  const later = () => {
    timeout = null;
    lastTriggerTime = options.leading ? Date.now() : 0;
    if (args && options.trailing) {
      func.apply(context, args); // ✅ 关键点：每次延迟结束都执行
      context = null;
      args = null;
    }
  };

  // 节流主函数
  const throttled = function (this: any, ...params: T) {
    const now = Date.now();
    context = this;
    args = params;

    // 计算剩余等待时间
    const remaining = wait - (now - lastTriggerTime);

    // CASE 1: 首次触发且需要立即执行
    if (!lastTriggerTime && options.leading) {
      func.apply(context, args);
      lastTriggerTime = now;
      return;
    }

    // CASE 2: 在冷却期内
    if (remaining > 0) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, remaining); // ⏳ 重置定时器
    }
    // CASE 3: 冷却期已过
    else {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastTriggerTime = now;
      func.apply(context, args); // 🔥 立即执行
    }
  };

  // 取消方法
  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
    lastTriggerTime = 0;
    context = null;
    args = null;
  };

  return throttled as ThrottledFunction<T>;
}

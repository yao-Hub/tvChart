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

interface IRepositionArr {
  oldIndex: number;
  newIndex: number;
  arr: unknown[];
}
export function repositionArr(params: IRepositionArr) {
  const { oldIndex, newIndex, arr } = params;
  if (
    oldIndex < 0 ||
    oldIndex >= arr.length ||
    newIndex < 0 ||
    newIndex >= arr.length
  ) {
    console.error("索引超出了数组范围");
    return arr;
  }
  const [removed] = arr.splice(oldIndex, 1);
  arr.splice(newIndex, 0, removed);
  return arr;
}

/**
 * 在数组对象中查找满足条件的元素
 * @param {Array<Object>} array - 要搜索的数组
 * @param {Object} conditions - 包含匹配条件的对象
 * @param {boolean} [exactMatch=true] - 是否要求完全匹配所有属性
 * @returns {Array<Object>} - 满足条件的元素数组
 */
export function findByProperties(
  array: Array<any>,
  conditions: Object,
  exactMatch = true
) {
  return array.filter((item) => {
    if (exactMatch) {
      // 完全匹配：检查条件中的每个属性是否都存在于对象中且值相等
      return Object.entries(conditions).every(
        ([key, value]) => item[key] === value
      );
    } else {
      // 部分匹配：检查对象是否包含条件中的至少一个属性且值相等
      return Object.entries(conditions).some(
        ([key, value]) => item[key] === value
      );
    }
  });
}

// 辅助函数：获取一个数（价位）的小数位数
export function getDecimalPlaces(num: number) {
  let strNum = num.toString();
  let decimalIndex = strNum.indexOf('.');
  if (decimalIndex === -1) {
    return 0;
  }
  return strNum.length - decimalIndex - 1;
}

// 保留有效小数
export function round(number: number, precision: number) {
  // return Math.round(+number + "e" + precision) / Math.pow(10, precision);
  //same as:
  // @ts-ignore
  return Number(Math.round(+number + 'e' + precision) + 'e-' + precision);
}

/**
* @param {Object} lists 所有数据 数组对象
* @param {string} keyWord 查询的关键词
* @param {string} key 指定查询lists字段
*/
export function selectMatchItem(lists: Array<any>, keyWord: string, key?: string) {
  let reg = new RegExp(keyWord, 'i');
  let resArr: any = [];
  lists.forEach(item => {
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

// 辅助函数：获取一个数（价位）的小数位数
export function getDecimalPlaces(num: number) {
  let strNum = num.toString();
  let decimalIndex = strNum.indexOf('.');
  if (decimalIndex === -1) {
    return 0;
  }
  return strNum.length - decimalIndex - 1;
}

export function round(number: number, precision: number) {
  // return Math.round(+number + "e" + precision) / Math.pow(10, precision);
  //same as:
  // @ts-ignore
  return Number(Math.round(+number + 'e' + precision) + 'e-' + precision);
}
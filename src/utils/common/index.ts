// 辅助函数：获取一个数的小数位数
export function getDecimalPlaces(num: number) {
  let strNum = num.toString();
  let decimalIndex = strNum.indexOf('.');
  if (decimalIndex === -1) {
    return 0;
  }
  return strNum.length - decimalIndex - 1;
}
export interface ITimezone {
  id: string; // 时区名称
  alias: string; // GMT时区，图表使用
  title: string; // 显示的名称
}

export const timezoneOptions: ITimezone[] = [
  {
    id: "Pacific/Fiji", // 斐济
    alias: "Etc/GMT-12",
    title: "UTC+12",
  },
  {
    id: "Pacific/Guadalcanal", // 所罗门群岛
    alias: "Etc/GMT-11",
    title: "UTC+11",
  },
  {
    id: "Asia/Vladivostok", // 俄罗斯 符拉迪沃斯托克
    alias: "Etc/GMT-10",
    title: "UTC+10",
  },
  {
    id: "Asia/Tokyo", // 东京
    alias: "Etc/GMT-9",
    title: "UTC+9",
  },
  {
    id: "Asia/Shanghai", // 上海
    alias: "Etc/GMT-8",
    title: "UTC+8",
  },
  {
    id: "Asia/Bangkok", // 曼谷
    alias: "Etc/GMT-7",
    title: "UTC+7",
  },
  {
    id: "Asia/Dhaka", // 达卡
    alias: "Etc/GMT-6",
    title: "UTC+6",
  },
  {
    id: "Asia/Karachi", // 卡拉奇
    alias: "Etc/GMT-5",
    title: "UTC+5",
  },
  {
    id: "Asia/Dubai", // 迪拜
    alias: "Etc/GMT-4",
    title: "UTC+4",
  },
  {
    id: "Europe/Moscow", // 莫斯科
    alias: "Etc/GMT-3",
    title: "UTC+3",
  },
  {
    id: "Europe/Athens", // 雅典
    alias: "Etc/GMT-2",
    title: "UTC+2",
  },
  {
    id: "Europe/Paris", // 巴黎
    alias: "Etc/GMT-1",
    title: "UTC+1",
  },
  {
    id: "Europe/London", // 伦敦
    alias: "Etc/UTC",
    title: "UTC",
  },
  {
    id: "Atlantic/Cape_Verde", // 佛得角
    alias: "Etc/GMT+1",
    title: "UTC-1",
  },
  {
    id: "Atlantic/South_Georgia", // 南乔治亚岛
    alias: "Etc/GMT+2",
    title: "UTC-2",
  },
  {
    id: "America/Argentina/Buenos_Aires", // 阿根廷
    alias: "Etc/GMT+3",
    title: "UTC-3",
  },
  {
    id: "America/Anguilla", // 美洲/安圭拉
    alias: "Etc/GMT+4",
    title: "UTC-4",
  },
  {
    id: "America/New_York", // 纽约
    alias: "Etc/GMT+5",
    title: "UTC-5",
  },
  {
    id: "America/Chicago", // 芝加哥
    alias: "Etc/GMT+6",
    title: "UTC-6",
  },
  {
    id: "America/Denver", // 丹佛
    alias: "Etc/GMT+7",
    title: "UTC-7",
  },
  {
    id: "America/Los_Angeles", // 洛杉矶
    alias: "Etc/GMT+8",
    title: "UTC-8",
  },
  {
    id: "America/Anchorage", // 阿拉斯加
    alias: "Etc/GMT+9",
    title: "UTC-9",
  },
  {
    id: "Pacific/Honolulu", // 夏威夷
    alias: "Etc/GMT+10",
    title: "UTC-10",
  },
  {
    id: "Pacific/Apia", // 萨摩亚
    alias: "Etc/GMT+11",
    title: "UTC-11",
  },
];

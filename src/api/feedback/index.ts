import request from "utils/http";
enum Api {
  SaveFeedback = "/feedback/save_feedback",
  Myfeedback = "/feedback/select_my_feedback",
}
interface reqSaveFeedback {
  platform: string; // 平台
  brokerName: string; // 经纪商
  lineName: string; // 交易线路
  feedbackContent: string; // 反馈内容
  feedbackFileIds?: string[]; //	反馈图片
}
// 提交反馈
export const saveFeedback = (data: reqSaveFeedback) => {
  return request({
    url: Api.SaveFeedback,
    method: "post",
    data,
    needLogin: true,
    noNeedServer: true,
    urlType: "admin",
  });
};

export interface resFeedback {
  login: number; //	登录名
  feedbackContent: string; //	反馈内容
  feedbackFileIds: string[]; // 反馈图片
  handleOpinion: string; //	处理意见（回复）
  handleTime: string; //	处理时间
  createTime: string; //	创建时间
}
// 查看问题反馈列表
export const myfeedback = () => {
  return request<resFeedback[]>({
    url: Api.Myfeedback,
    method: "post",
    needLogin: true,
    noNeedServer: true,
    urlType: "admin",
  });
};

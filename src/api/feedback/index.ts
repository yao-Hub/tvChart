import request from "utils/http";
enum Api {
  SaveFeedback = "/admin-api/feedback/save_feedback",
  Myfeedback = "/admin-api/feedback/select_my_feedback",
  UploadFile = "/admin-api/my/upload_files",
}
interface reqSaveFeedback {
  platform: string;
  brokerName: string; // 经纪商
  lineName: string; // 交易线路
  feedbackContent: string; // 反馈内容
  feedbackFileIds?: string[]; //	反馈图片
  createTime: number;
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
  feedbackReply: string; //	处理意见（回复）
  replyTime: number; //	处理时间
  createTime: number; //	创建时间
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

import { encrypt } from "utils/DES/JS";
import { generateUUID } from "@/utils/common";
export const uploadFile = (params: { file: File; type: number }) => {
  const req = {
    type: params.type,
    req_id: generateUUID(),
    req_time: new Date().getTime(),
  };
  return request<{ fileId: string; url: string }>({
    url: Api.UploadFile,
    method: "post",
    data: {
      file: params.file,
      req: JSON.stringify({
        action: "my/upload_files",
        d: encrypt(JSON.stringify(req)),
      }),
    },
    headers: {
      "Content-Type": "multipart/form-data",
    },
    urlType: "admin",
    customData: true,
    isNotSaveDB: true,
  });
};

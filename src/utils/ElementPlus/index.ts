import { h } from "vue";
import { ElMessage } from "element-plus";
import BaseImg from "@/components/BaseImg/index.vue";

type MessageType = "success" | "warning";

// element plus 提示图标更改
export const changeElementPlusMessageIcon = () => {
  const MySuccessIcon = h(BaseImg, { iconName: "icon_success" });
  const MyWarningIcon = h(BaseImg, { iconName: "icon_waring" });
  const iconMap: Record<MessageType, ReturnType<typeof h>> = {
    success: MySuccessIcon,
    warning: MyWarningIcon,
  };
  const types: MessageType[] = ["success", "warning"];
  types.forEach((type) => {
    const original = ElMessage[type];
    ElMessage[type] = (options) => {
      if (typeof options === "string") {
        options = { message: options };
      }
      return original({
        ...options,
        icon: iconMap[type],
      });
    };
  });
};

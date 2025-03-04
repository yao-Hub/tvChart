import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { ElMessage } from "element-plus";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

export function useDisclaimers() {
  const dialogStore = useDialog();
  const orderStore = useOrder();
  const { t } = useI18n();

  const agree = ref<boolean>(false);

  const handleOk = (e: MouseEvent) => {
    if (agree.value) {
      dialogStore.closeDialog("disclaimersVisible");
      orderStore.setOneTrans(true);
      return;
    }
    ElMessage({
      type: "warning",
      message: t("tip.agreeTermsFirst"),
    });
  };

  const handleCancle = () => {
    agree.value = false;
    orderStore.setOneTrans(false);
    dialogStore.closeDialog("disclaimersVisible");
  };
  return { handleOk, handleCancle, agree, dialogStore };
}

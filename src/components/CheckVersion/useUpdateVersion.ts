import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";

import { useDialog } from "@/store/modules/dialog";
import { useVersion } from "@/store/modules/version";
import { classifyUrl } from "@/utils/common";

export function useUpdateVersion() {
  const { t } = useI18n();

  const versionInfo = computed(() => useVersion().versionInfo);

  const nowVersion = computed(() => {
    return useVersion().versionInfo?.version || _VERSION_;
  });

  const closeDialog = () => {
    useDialog().closeDialog("updateVersionVisible");
  };
  const update = () => {
    if (versionInfo.value) {
      const url = versionInfo.value.downloadUrl;
      const urlType = classifyUrl(url);
      closeDialog();

      if (urlType === "download") {
        useDialog().openDialog("updateProgressVisible");
        window.electronAPI.invoke("start-download", url);
      }
      if (urlType === "normal") {
        window.electronAPI.invoke("openExternal", url);
      }
      if (urlType === "invalid") {
        ElMessage.error(t("invalid download url"));
      }
    }
  };
  return { t, closeDialog, update, versionInfo, nowVersion };
}

import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { useDialog } from "@/store/modules/dialog";
import { useVersion } from "@/store/modules/version";

export function useUpdateVersion() {
  const { t } = useI18n();

  const versionInfo = computed(() => useVersion().versionInfo);

  const closeDialog = () => {
    useDialog().closeDialog("updateVersionVisible");
  };
  const update = () => {
    if (versionInfo.value) {
      closeDialog();
      useDialog().openDialog("updateNoticeVisible");
      window.electronAPI.invoke(
        "start-download",
        versionInfo.value.downloadUrl
      );
    }
  };
  return { t, closeDialog, update, versionInfo };
}

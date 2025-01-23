<template>
  <div class="base_Image" v-if="!ifError && !path && props.progress">
    <el-progress
      type="circle"
      :percentage="percentage"
      color="#fff"
      :width="20"
      :stroke-width="2"
      :show-text="false"
    ></el-progress>
  </div>
  <el-image v-else v-bind="props" :src="path" class="image"></el-image>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watchEffect } from "vue";
interface Props {
  src: string;
  progress?: boolean;
}

const props = defineProps<Props>();

const path = ref("");
const percentage = ref(0);
const ifError = ref(false);
const ifDev = import.meta.env.MODE === "development";

const getImage = () => {
  ifError.value = false;
  percentage.value = 0;

  const urlObj = new URL(props.src);
  const pathname = urlObj.pathname;
  const devUrl = import.meta.env.VITE_HTTP_URL_FILE;
  axios({
    url: `${ifDev ? `${devUrl}${pathname}` : props.src}`,
    responseType: "blob",
    onDownloadProgress: (progressEvent) => {
      const { loaded, total } = progressEvent;
      if (total) {
        percentage.value = (loaded / total) * 100;
      }
    },
    data: {},
  })
    .then((res) => {
      percentage.value = 100;
      path.value = URL.createObjectURL(res.data);
    })
    .catch(() => {
      percentage.value = 0;
      ifError.value = true;
    });
};

watchEffect(() => {
  if (props.src) {
    getImage();
  }
});
</script>

<style lang="scss" scoped>
.base_Image {
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.image {
  width: 100%;
  height: 100%;
}
:deep(.el-progress-circle svg path:first-child) {
  stroke: #000;
}
</style>

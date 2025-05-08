<template>
  <div class="base_Image" v-if="loading">
    <el-progress
      type="circle"
      :percentage="percentage"
      color="#fff"
      :width="20"
      :stroke-width="2"
      :show-text="false"
    ></el-progress>
  </div>
  <el-image v-else v-bind="props" class="image" lazy></el-image>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, watchEffect } from "vue";
interface Props {
  src: string;
}

const props = defineProps<Props>();

const path = ref("");
const percentage = ref(0);
const loading = ref(false);
const getImage = () => {
  percentage.value = 0;
  loading.value = true;
  axios({
    url: props.src,
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
    })
    .finally(() => (loading.value = false));
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

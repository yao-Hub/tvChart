<template>
  <div class="page">
    <el-result sub-title="Sorry, the page you visited does not exist">
      <template #icon>
        <BaseImg iconName="404" catalog="images" imgSuffix="jpg" />
      </template>
      <template #extra>
        <el-button type="primary" @click="$router.push({ path: '/' })">{{
          $t("goHome")
        }}</el-button>
      </template>
    </el-result>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

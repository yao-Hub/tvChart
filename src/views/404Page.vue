<template>
  <div class="page">
    <a-result
      status="404"
      title="404"
      sub-title="Sorry, the page you visited does not exist."
    >
      <template #extra>
        <a-button type="primary" @click="$router.push({ path: '/' })"
          >Back Home</a-button
        >
      </template>
    </a-result>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

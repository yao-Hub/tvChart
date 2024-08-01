<template>
  <div class="item" @click="showModal">
    <TeamOutlined />
    <span>{{ $t("aboutUs") }}</span>
  </div>

  <a-modal v-model:open="open" :title="$t('aboutUs')" @ok="handleOk">
    <p>{{ $t("company") }}: 广州微派</p>
    <p>Tel: +86 8803 445</p>
    <p>FaX: +86 8803 445</p>
    <p>Web: www.weipai.com</p>
    <p>Email: info@utrader.com</p>
  </a-modal>
</template>

<script setup lang="ts">
import { TeamOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
const open = ref<boolean>(false);

const showModal = () => {
  open.value = true;
};

const handleOk = (e: MouseEvent) => {
  console.log(e);
  open.value = false;
};
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  gap: 5px;
}
p {
  margin: 10px 0;
}
</style>

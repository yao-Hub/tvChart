<template>
  <div class="transaction">
    <div class="transaction_left">
      <BulbOutlined />
      <span>{{ $t('lightTheme') }}</span>
    </div>
    <a-switch v-model:checked="checked" size="small" @change="handleChange"/>
  </div>
</template>

<script setup lang="ts">
import { BulbOutlined } from '@ant-design/icons-vue';
import { ref } from 'vue';
import { useTheme } from '@/store/modules/theme';
const themeStore = useTheme();
const currentTheme=  themeStore.getTheme();

const checked = ref(false);
checked.value = currentTheme !== 'dark';
const handleChange = (checked: boolean) => {
  themeStore.setTheme(checked ? 'light' : 'dark');
}

</script>

<style lang="scss" scoped>
.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;

  &_left {
    display: flex;
    gap: 5px;
  }
}
</style>

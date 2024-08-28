<template>
  <div
    class="Block"
    @click="emit('blockClick')"
    :style="{ cursor: type === 'count' ? 'pointer' : 'default' }"
  >
    <a-flex vertical justify="center" :gap="5">
      <slot name="title">
        <span class="title">{{ title }}</span>
        <span class="describe">{{ describe }}</span>
      </slot>
    </a-flex>

    <a-flex align="center" v-if="type === 'radio' && !loading">
      <PlusCircleOutlined
        class="btn"
        v-if="!ifChecked"
        @click="emit('btnClick', 'add')"
      />
      <CheckCircleOutlined
        class="checkBtn btn"
        v-else
        @click="emit('btnClick', 'cancel')"
      />
    </a-flex>
    <a-flex align="center" v-if="type === 'count' && !loading">
      <span>{{ count }}/{{ total }}</span>
    </a-flex>

    <LoadingOutlined v-if="loading" />
  </div>
</template>

<script setup lang="ts">
import {
  PlusCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons-vue";
interface Props {
  title?: string;
  describe?: string;
  ifChecked?: boolean;
  type?: "count" | "radio";
  total?: string | number;
  count?: string | number;
  loading?: boolean;
}
withDefaults(defineProps<Props>(), {
  total: 0,
  count: 0,
});
const emit = defineEmits(["blockClick", "btnClick"]);
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.Block {
  width: 100%;
  height: 48px;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 6px 16px;

  &:hover {
    @include background_color("background");
  }

  .title {
    font-size: 14px;
    @include font_color("word");
  }

  .describe {
    font-size: 12px;
    @include font_color("word-gray");
  }

  .btn {
    cursor: pointer;
    font-size: 14px;

    &:hover {
      @include font_color("primary");
    }
  }

  .checkBtn {
    @include font_color("word-gray");
  }
}
</style>

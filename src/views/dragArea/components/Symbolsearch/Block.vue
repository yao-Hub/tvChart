<template>
  <div
    class="Block"
    @click="emit('blockClick')"
    :style="{ cursor: 'pointer', ...styles }"
  >
    <div class="label">
      <slot name="title">
        <span class="title">{{ title }}</span>
        <span class="describe">{{ describe }}</span>
      </slot>
    </div>

    <div v-if="type === 'radio' && !hideStar" class="opera">
      <LoadingOutlined v-if="loading" />
      <BaseImg
        class="logo btn"
        iconName="icon_star_noactive"
        v-else-if="!ifChecked"
        @click="emit('btnClick', 'add')"
      />
      <BaseImg
        class="logo btn"
        iconName="icon_star_active"
        v-else="ifChecked"
        @click="emit('btnClick', 'cancel')"
      />
    </div>
    <div class="count" v-if="type === 'count'">
      <LoadingOutlined v-if="loading" />
      <span v-else>{{ count }}/{{ total }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoadingOutlined } from "@ant-design/icons-vue";
interface Props {
  title?: string;
  describe?: string;
  ifChecked?: boolean;
  type?: "count" | "radio";
  total?: string | number;
  count?: string | number;
  loading?: boolean;
  styles?: object;
  hideStar?: boolean;
}
withDefaults(defineProps<Props>(), {
  total: 0,
  count: 0,
});
const emit = defineEmits(["blockClick", "btnClick"]);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.Block {
  width: 100%;
  height: 48px;
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 6px 16px;

  &:hover {
    @include background_color("background-component");
  }

  .label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    .title {
      @include font_color("word");
    }
    .describe {
      @include font_color("word-gray");
    }
  }

  .opera,
  .count {
    display: flex;
    align-items: center;
    @include font_color("word-gray");
  }

  .btn {
    cursor: pointer;
  }
}
</style>

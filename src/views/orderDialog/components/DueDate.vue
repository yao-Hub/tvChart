<template>
  <div class="dueDate">
    <div style="display: flex;">
      <a-checkbox v-model:checked="state.checked">到期日</a-checkbox>
      <div :class="[ifError ? 'complete' : '']">
        <a-tooltip :title="ifError ? '请选择正确日期' : ''" v-model:open="ifError">
          <a-date-picker size="small" :allowClear="false" v-model:value="day" :disabled="!state.checked" :format="dateFormat" :disabled-date="disabledDate"/>
        </a-tooltip>
      </div>
      <a-time-picker v-model:value="time" :allowClear="false" :format="timeFormat" :showNow="false" size="small" :disabled="!state.checked"/>
    </div>
    <span v-show="state.checked">持续时间：{{ state.duration }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue';
import dayjs, { Dayjs } from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const dateFormat = 'DD/MM/YYYY';
const timeFormat = 'HH:mm';

const state = reactive({
  checked: false,
  duration: ''
});

const emit = defineEmits([ 'dueDate', 'dueDateFail' ]);

const day = ref<Dayjs>(dayjs());
const time = ref<Dayjs>(dayjs().add(12, 'minute'));

// Can not select days before today
const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf('day');
};

// 自动更新时间
let timer: NodeJS.Timeout;
onMounted(() => {
  timer = setInterval(() => {
    if (!state.checked) {
      time.value = dayjs().add(12, 'minute');
      day.value = dayjs();
    }
    getDuration();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(timer);
});


const dayTimeStamp = computed(() => {
  const daystr = dayjs(day.value).format(dateFormat);
  const timestr = dayjs(time.value).format(timeFormat);
  const timeStamp = dayjs(`${daystr} ${timestr}`, `${dateFormat} ${timeFormat}`).unix();
  return timeStamp;
});

const getDuration = () => {
  const distanceFromNow = dayjs.unix(dayTimeStamp.value).fromNow();
  if (distanceFromNow.includes('ago') || distanceFromNow.includes('前')) {
    emit('dueDateFail');
    state.duration = '过期';
    return;
  }
  state.duration = distanceFromNow;
  emit('dueDate', dayTimeStamp.value);
}

const ifError = computed(() => state.duration === '过期');

</script>

<style lang="scss" scoped>
  .dueDate {
    display: flex;
    flex-direction: column;
    .complete {
      position: relative;
      &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        background: #9f4747;
        z-index: 9;
        border-radius: 5px;
        opacity: 0.6;
        pointer-events: none;
      }
    }
  }
</style>
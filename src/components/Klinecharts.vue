<template>
  <div>
    <div id="k-line-chart" :style="{ height: Height }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { init } from 'klinecharts'
import moment from 'moment'

interface ChartData {
  // 时间戳，毫秒级别，必要字段
  timestamp: number
  // 开盘价，必要字段
  open: number
  // 收盘价，必要字段
  close: number
  // 最高价，必要字段
  high: number
  // 最低价，必要字段
  low: number
  // 成交量，非必须字段
  volume?: number
  // 成交额，非必须字段，如果需要展示技术指标'EMV'和'AVP'，则需要为该字段填充数据。
  turnover?: number
  date_time?: number
}

interface Props {
  height?: number | string
  chartData?: ChartData[],
  newLine?: Array<ChartData>
  newQuote?: {
    ask: number
    bid: number
    ctm: number
    ctm_ms: number
    server: string
    symbol: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  chartData: () => [],
  newLine: () => [],
  newQuote: () => {
    return {
      ask: 0,
      bid: 0,
      ctm: 0,
      ctm_ms: 0,
      server: '',
      symbol: '',
    }
  }
})

const chart = ref()

onMounted(() => {
  chart.value = init('k-line-chart')
})

const Height = ref(props.height);
// 图表的高度
watch(
  () => props.height,
  () => {
    Height.value = props.height
    setTimeout(() => {
      chart.value.resize()
    })
  },
);

// 初始化数据
watch(
  () => props.chartData,
  data => {
    if (chart.value) {
      chart.value.applyNewData(data)
    }
  },
);

watch(
  () => props.newLine,
  lines => {
    lines.forEach(item => {
      chart.value.updateData({
        ...item,
        timestamp: moment(item.date_time).valueOf()
      })
    })
  }
)

watch(
  () => props.newQuote,
  quote => {
    const dataList = chart.value.getDataList()
    const lastData = dataList[dataList.length - 1]
    const newData = { ...lastData }
    newData.close = quote.bid
    newData.high = Math.max(newData.high, quote.bid)
    newData.low = Math.min(newData.low, quote.bid)
    chart.value.updateData(newData)
  }
)

</script>

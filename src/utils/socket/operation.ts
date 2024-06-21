import SingletonSocket from 'utils/socket'
import { useChartSub } from '@/store/modules/chartSub';

export const socket = SingletonSocket.getInstance(import.meta.env.VITE_WEB_SOCKET_URL);

interface Props {
  resolution: string | number
  symbol: string
}

// 订阅
export const subscribeSocket = ({ resolution, symbol }: Props) => {
  socket.emit("subscribe_kline", {
    "server": "upway-live",
    "symbol_period_type": [{
      symbol,
      period_type: resolution
    }]
  });

  socket.emit("subscribe_qoute", {
    "server": "upway-live",
    "symbols": [ symbol ]
  });
}

// 取消订阅
export const unsubscribeSocket = ({ resolution, symbol }: Props) => {
  const subStore = useChartSub();

  const list = subStore.mustSubscribeList;
  if (list.indexOf(symbol) > -1) {
    console.warn(`${symbol}品种需要持续监听，无法取消监听`);
    return;
  }
  socket.emit("unsubscribe_kline", {
    "server": "upway-live",
    "symbol_period_type": [{
      symbol,
      period_type: resolution
    }]
  });
  socket.emit("unsubscribe_qoute", {
    "server": "upway-live",
    "symbol_period_type": [ symbol ]
  });
}
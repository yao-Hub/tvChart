import { useOrder } from '@/store/modules/order';

const orderStore = useOrder();

export const keydownList = [
  {
    keyCode: 120,
    key: 'f9',
    callback: () => {
      orderStore.createOrder();
    }
  }
];

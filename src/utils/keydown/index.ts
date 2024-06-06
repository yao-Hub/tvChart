import OrderStore from '@/store/modules/order';

const Order = OrderStore();

export const keydownList = [
  {
    keyCode: 120,
    key: 'f9',
    callback: () => {
      Order.createOrder();
    }
  }
];

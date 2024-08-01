import { useOrder } from "@/store/modules/order";

export const keydownList = [
  {
    keyCode: 120,
    key: "f9",
    callback: () => {
      const orderStore = useOrder();
      orderStore.createOrder();
    },
  },
];

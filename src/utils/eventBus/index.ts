import { ref } from "vue";

const eventBus = {
  events: ref<{ [key: string]: ((...args: any[]) => void)[] }>({}),
  on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.events.value[eventName]) {
      this.events.value[eventName] = [];
    }
    this.events.value[eventName].push(callback);
  },
  emit(eventName: string, ...args: any[]) {
    if (this.events.value[eventName]) {
      this.events.value[eventName].forEach((callback) => callback(...args));
    }
  },
};

export default eventBus;

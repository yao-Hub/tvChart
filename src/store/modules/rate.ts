import * as types from "#/chart/index";
import { alllRates } from "api/symbols/index";
import dayjs from "dayjs";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useSocket } from "./socket";
import { useSymbols } from "./symbols";
import { useUser } from "./user";

type currentRates = Record<string, types.IRate>;

export const useRate = defineStore("rate", () => {
  const symbolsStore = useSymbols();
  const userStore = useUser();
  const socketStore = useSocket();

  const currentRates = ref<currentRates>({});

  // 所有汇率
  const getAllRates = async () => {
    const rates = await alllRates();
    rates.data.forEach((item) => {
      currentRates.value[item.symbol] = item;
    });
  };

  // 查找symbol的汇率
  const getSymbolRate = (symbol: string): types.IRate => {
    let result = {
      symbol,
      bid_rate: 1,
      ask_rate: 1,
      update_time: dayjs().valueOf(),
    };
    const loginInfo = userStore.loginInfo;
    const logCur = loginInfo?.currency;
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    const symCur = symbolInfo?.currency;
    if (logCur && symCur) {
      if (logCur === symCur) {
        return result;
      }
      const currency = `${symCur}${logCur}`;
      return currentRates.value[currency];
    }
    return result;
  };

  const subRate = () => {
    socketStore.subRate((e) => {
      currentRates.value[e.symbol] = e;
    });
  };

  return {
    getAllRates,
    getSymbolRate,
    subRate,
    currentRates,
  };
});

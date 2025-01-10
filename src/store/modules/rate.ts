import * as types from "#/chart/index";
import { alllRates } from "api/symbols/index";
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

  type TRateKey = "user_pre" | "pre_user" | "last_user" | "user_last";
  type IRate = {
    [key in TRateKey]: {
      bid_rate: number;
      ask_rate: number;
    };
  };
  // 获取symbol的汇率
  const getRate = (symbol: string): IRate => {
    const result = {
      user_pre: { bid_rate: 1, ask_rate: 1 },
      pre_user: { bid_rate: 1, ask_rate: 1 },
      last_user: { bid_rate: 1, ask_rate: 1 },
      user_last: { bid_rate: 1, ask_rate: 1 },
    };
    const originItem = { bid_rate: 1, ask_rate: 1 };
    const loginInfo = userStore.loginInfo;
    const symbolInfo = symbolsStore.symbols.find((e) => e.symbol === symbol);
    const userCur = loginInfo?.currency; // 账户币种
    const preCur = symbolInfo?.pre_currency; // 前币种
    const lastCur = symbolInfo?.currency; // 后币种

    const rates = currentRates.value;
    if (userCur && preCur) {
      if (userCur !== preCur) {
        const pre_user = `${preCur}${userCur}`;
        const user_pre = `${userCur}${preCur}`;
        result.pre_user = rates[pre_user] || { ...originItem };
        result.user_pre = rates[user_pre] || { ...originItem };
      }
    }
    if (userCur && lastCur) {
      if (userCur !== lastCur) {
        const last_user = `${lastCur}${userCur}`;
        const user_last = `${userCur}${lastCur}`;
        result.last_user = rates[last_user] || { ...originItem };
        result.user_last = rates[user_last] || { ...originItem };
      }
    }
    return result;
  };

  const subRate = () => {
    socketStore.subRate((e) => {
      currentRates.value[e.symbol] = e;
    });
  };
  function $reset() {
    currentRates.value = {};
  }

  return {
    getAllRates,
    getRate,
    subRate,
    currentRates,
    $reset,
  };
});

import { defineStore } from "pinia";
import { resQueryNode } from "api/account/index";

interface State {
  nodeName: string
  nodeList: resQueryNode[]
}

export const useNetwork = defineStore("network", {
  state: (): State => {
    return {
      nodeName: "",
      nodeList: []
    };
  },

  getters: {
    currentNode: (state) => {
      return state.nodeList.find(e => e.nodeName === state.nodeName);
    },
  },
});

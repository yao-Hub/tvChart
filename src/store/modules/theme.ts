import { defineStore } from 'pinia';
import { theme } from 'ant-design-vue';

const { darkAlgorithm, compactAlgorithm } = theme;

interface State {
  currentTheme: string
}

export default defineStore("theme", {
  state(): State {
    return {
      currentTheme: 'dark'
    }
  },
  getters: {
    antDTheme: (state) => {
      if (state.currentTheme === 'dark') {
        return [darkAlgorithm, compactAlgorithm]
      }
      return [compactAlgorithm]
    }
  }
})

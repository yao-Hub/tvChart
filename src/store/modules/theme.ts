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
      window.document.documentElement.setAttribute('data-theme', state.currentTheme);
      if (state.currentTheme === 'dark') {
        return [darkAlgorithm, compactAlgorithm]
      }
      return [compactAlgorithm]
    }
  }
})

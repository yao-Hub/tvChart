import { defineStore } from 'pinia';
import { theme } from 'ant-design-vue';

interface State {
  currentTheme: string
}

export const useTheme = defineStore('theme', {
  state(): State {
    return {
      currentTheme: 'dark'
    }
  },
  getters: {
    antDTheme: (state) => {
      window.document.documentElement.setAttribute('data-theme', state.currentTheme);
      if (state.currentTheme === 'dark') {
        return {
          algorithm: theme.darkAlgorithm,
        };
      }
      return {
        algorithm: theme.compactAlgorithm,
      };
    }
  }
})

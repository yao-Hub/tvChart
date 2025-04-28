import { App, AppContext, createVNode, render, Component } from "vue"; // 导入AppContext

function createComponent(component: Component) {
  let appContext: AppContext | null = null;

  return {
    install(app: App) {
      appContext = app._context;
    },
    mount(props?: Record<string, any>) {
      if (!appContext) throw new Error("Component not installed");

      const div = document.createElement("div");
      document.body.appendChild(div);

      const unmount = () => {
        render(null, div);
        document.body.removeChild(div);
      };

      const vnode = createVNode(component, {
        ...props,
        onClose: unmount, // 将关闭函数作为 props 传递给组件
      });
      vnode.appContext = appContext;

      render(vnode, div);

      return {
        unmount,
      };
    },
  };
}

import ServerInfo from "@/views/serverInfo/index.vue";
const serverInfoPlugin = createComponent(ServerInfo);
export default { serverInfoPlugin };

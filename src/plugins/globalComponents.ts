import { createVNode, render, App, Component } from "vue";

function createComponent(component: Component) {
  return {
    install(app: App) {
      const div = document.createElement("div");
      document.body.appendChild(div);

      const vnode = createVNode(component);
      vnode.appContext = app._context; // 共享主应用上下文

      render(vnode, div);
    },
  };
}

// 导入组件
import UpdateNotice from "../components/updateNotice.vue";
import CheckVersion from "../components/CheckVersion/index.vue";
import ServerInfo from "../views/serverInfo/index.vue";

const updateNoticePlugin = createComponent(UpdateNotice);
const checkVersionPlugin = createComponent(CheckVersion);
const ServerInfoPlugin = createComponent(ServerInfo);

export default { updateNoticePlugin, checkVersionPlugin, ServerInfoPlugin };

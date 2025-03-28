import { createVNode, render, App } from "vue";
import GlobalDialog from "../components/UpdateVersion/index.vue";

const dialogPlugin = {
  install(app: App) {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const vnode = createVNode(GlobalDialog);
    vnode.appContext = app._context; // Share the main app's context

    render(vnode, div);
  },
};

export default dialogPlugin;

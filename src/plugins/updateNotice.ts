import { createVNode, render, App } from "vue";
import UpdateNotice from "../components/updateNotice.vue";

const checkVersionPlugin = {
  install(app: App) {
    const div = document.createElement("div");
    document.body.appendChild(div);

    const vnode = createVNode(UpdateNotice);
    vnode.appContext = app._context; // Share the main app's context

    render(vnode, div);
  },
};

export default checkVersionPlugin;

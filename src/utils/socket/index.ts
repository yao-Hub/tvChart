import { ElMessage } from "element-plus";
import { io, Socket } from "socket.io-client";
import { useSocket } from "@/store/modules/socket";

import eventBus from "utils/eventBus";

class SingletonSocket {
  private instance: Socket | null = null;

  constructor() {}

  getInstance(mainUri: string, query: string = ""): Socket {
    if (!this.instance) {
      this.instance = io(`${mainUri}${query}`, {
        transports: ["websocket"],
        reconnection: true, // 开启重连功能
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      this.setupSocketEvents();
    }
    return this.instance;
  }

  setupSocketEvents(): void {
    if (this.instance) {
      // 移除旧监听器避免重复绑定
      this.instance.off("connect");
      this.instance.off("disconnect");
      this.instance.off("connect_error");

      this.instance.on("connect", () => {
        eventBus.emit("socket-connect");
        console.log(`websocket已连接`);
      });

      this.instance.on("disconnect", (reason: string) => {
        console.log(`websocket已断开${reason}`);
        if (reason === "transport close") {
          setTimeout(() => {
            this.instance?.connect();
            useSocket().reEmit();
          }, 1000);
        }
        eventBus.emit("socket-disconnect");
      });

      this.instance.on("connect_error", (error) => {
        console.error("websocket连接错误:", error);
        eventBus.emit("socket-error");
        ElMessage.error("Socekt Connect Error");
      });
    }
  }
}

export default SingletonSocket;

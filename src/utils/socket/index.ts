import { ElMessage } from "element-plus";
import { io, Socket } from "socket.io-client";

import eventBus from "utils/eventBus";

class SingletonSocket {
  private instance: Socket | null = null;

  constructor() {}

  getInstance(mainUri: string, query: string = ""): Socket {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
    this.instance = io(`${mainUri}${query}`, {
      transports: ["websocket"],
      reconnection: true, // 开启重连功能
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    this.setupSocketEvents();
    return this.instance;
  }

  setupSocketEvents(): void {
    if (this.instance) {
      this.instance.on("connect", () => {
        eventBus.emit("socket-connect");
        console.log(`websocket已连接`);
      });

      this.instance.on("disconnect", (reason: string) => {
        // 手动断开
        console.log(`websocket已断开${reason}`);
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

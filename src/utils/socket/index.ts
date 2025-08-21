import { ElMessage } from "element-plus";
import { io, Socket } from "socket.io-client";
import { useSocket } from "@/store/modules/socket";

import eventBus from "utils/eventBus";

class SingletonSocket {
  private instance: Socket | null = null;

  private errReason: string = "";

  constructor() {}

  getInstance(mainUri: string, query: string = ""): Socket {
    if (!this.instance) {
      this.instance = io(`${mainUri}${query}`, {
        transports: ["websocket"],
        reconnection: true, // 开启重连功能
        // reconnectionAttempts: 5, //  重连次数
        // reconnectionDelay: 3000, // 重连间隔
        extraHeaders: {
          Connection: "Upgrade",
        },
      });
    }
    this.setupSocketEvents();
    return this.instance;
  }

  setupSocketEvents(): void {
    if (this.instance) {
      // 移除旧监听器避免重复绑定
      this.instance.off("connect");
      this.instance.off("disconnect");
      this.instance.off("connect_error");

      this.instance.on("connect", () => {
        if (this.errReason === "transport close") {
          useSocket().reEmit();
        }
        this.errReason = "";
        eventBus.emit("socket-connect");
        console.log(`websocket已连接`);
      });

      this.instance.on("disconnect", (reason: string) => {
        // 调用方法主动断开不做处理
        console.log(`websocket已断开${reason}`);
        if (reason === "io client disconnect") {
          return;
        }
        this.errReason = reason;
        eventBus.emit("socket-disconnect");
      });

      this.instance.on("connect_error", (error) => {
        console.log("websocket连接错误:", error);
        ElMessage.error("Socekt Connect Error");
        eventBus.emit("socket-error");
      });

      this.instance.on("error", (error) => {
        console.log("websocket错误:", error);
        ElMessage.error("Socekt Error");
        eventBus.emit("socket-error");
        if (this.instance) {
          this.instance.connect();
        }
      });
    }
  }

  close() {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
  }
}

export default SingletonSocket;

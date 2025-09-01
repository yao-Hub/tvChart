import { ElMessage } from "element-plus";
import { io, Socket } from "socket.io-client";
import { useSocket } from "@/store/modules/socket";

import eventBus from "utils/eventBus";

class SingletonSocket {
  private instance: Socket | null = null;

  private errReason: string = "";

  private mainUri: string = "";
  private queryGenerator: (() => Promise<string>) | null = null;
  constructor() { }

  async getInstance(mainUri: string, queryGenerator: () => Promise<string>): Promise<Socket> {
    this.mainUri = mainUri;
    this.queryGenerator = queryGenerator;

    if (!this.instance) {
      await this.createInstance();
    }
    this.setupSocketEvents();
    return Promise.resolve(this.instance as Socket);
  }
  private async createInstance() {
    if (this.queryGenerator && this.mainUri) {
      const query = await this.queryGenerator();
      this.instance = io(`${this.mainUri}${query}`, {
        transports: ["websocket"],
        reconnection: true,
        extraHeaders: {
          Connection: "Upgrade",
        },
      });
    }
  }

  setupSocketEvents(): void {
    if (this.instance) {
      // 移除旧监听器避免重复绑定
      this.instance.off("connect");
      this.instance.off("disconnect");
      this.instance.off("connect_error");
      this.instance.off("reconnect_attempt"); // 重连尝试事件监听

      this.instance.on("reconnect_attempt", async () => {
        console.log("准备重连，更新连接参数...");
        if (this.instance) {
          this.instance.disconnect();
        }
        await this.createInstance();
        this.setupSocketEvents(); // 重新绑定事件
      });

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

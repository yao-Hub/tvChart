import { ElMessage } from "element-plus";
import { io, Socket } from "socket.io-client";

import eventBus from "utils/eventBus";

import { useSocket } from "@/store/modules/socket";

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
        console.log(`main socket Connected to server`);
      });

      this.instance.on("disconnect", (reason: string) => {
        // 手动断开
        console.log(`main socket disconnect${reason}`);
        eventBus.emit("socket-disconnect");
      });

      this.instance.on("connect_error", (error) => {
        eventBus.emit("socket-error");
        console.error("connect_error:", error);
        ElMessage.error("Socekt Connect Error");
      });
    }
  }

  getSocketDelay(
    uriList: string[],
    query: string = "",
    callback?: ({ ending }: { ending: boolean }) => void
  ) {
    const startTimeMap: Record<string, number> = {};
    const endinglist = uriList.map((uri) => {
      return {
        uri,
        ending: false,
      };
    });
    uriList.forEach((uri) => {
      startTimeMap[uri] = new Date().getTime();
      if (callback) {
        callback({ ending: false });
      }
      const IO = io(`${uri}${query}`, {
        transports: ["websocket"],
        reconnection: false,
      });
      IO.on("connect", () => {
        const endTime = new Date().getTime();
        const connectionTime = endTime - startTimeMap[uri];
        const socketStore = useSocket();
        socketStore.delayMap[uri] = connectionTime;
        const target = endinglist.find((e) => e.uri === uri);
        if (target) {
          target.ending = true;
        }
        const ifEnding = endinglist.every((item) => item.ending === true);
        if (callback) {
          callback({ ending: ifEnding });
        }
        console.log(`getDelay ${uri}: ${connectionTime} milliseconds`);
        IO.disconnect();
      });
      IO.on("disconnect", (reason: string) => {
        const target = endinglist.find((e) => e.uri === uri);
        if (target) {
          target.ending = true;
        }
        const ifEnding = endinglist.every((item) => item.ending === true);
        if (callback) {
          callback({ ending: ifEnding });
        }
        console.log(`getDelay ${uri} disconnect: ${reason}`);
      });
    });
  }
}

export default SingletonSocket;

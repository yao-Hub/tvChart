import { io, Socket } from "socket.io-client";
import { useSocket } from "@/store/modules/socket";

class SingletonSocket {
  private instance: Socket | null = null;

  constructor() {}

  getInstance(mainUri: string): Socket {
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
    this.instance = io(mainUri, {
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
      this.instance!.on("connect", () => {
        console.log(`main socket Connected to server`);
      });

      this.instance!.on("disconnect", (reason: string) => {
        // 手动断开
        if (reason === "io client disconnect") {
          console.log("Disconnected from server");
        } else {
          console.log("Connection lost, trying to reconnect...");
        }
      });
    }
  }

  getSocketDelay(uriList: string[]) {
    const startTimeMap: Record<string, number> = {};
    uriList.forEach(uri => {
      startTimeMap[uri] = new Date().getTime();
      const IO = io(uri, {
        transports: ["websocket"],
        reconnection: true, // 开启重连功能
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      IO.on("connect", () => {
        const endTime = new Date().getTime();
        const connectionTime = endTime - startTimeMap[uri];
        const socketStore = useSocket();
        socketStore.delayMap[uri] = connectionTime;
        console.log(`${uri} Connection established in ${connectionTime} milliseconds`);
        IO.disconnect();
      });
      IO.on("disconnect", (reason: string) => {
        if (reason === "io client disconnect") {
          console.log(`${uri} Disconnected from server`);
        } else {
          console.log(`${uri} Connection lost, trying to reconnect...`);
        }
      });
    })
  }
}

export default SingletonSocket;

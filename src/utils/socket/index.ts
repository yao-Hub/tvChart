import { io, Socket } from "socket.io-client";
import { useSocket } from "@/store/modules/socket";

class SingletonSocket {
  private instance: Socket | null = null;
  private mainUri: string;
  private uriList: string[];

  private startTimeMap: Record<string, number> = {};
  
  constructor(params: { wsUriList: string[], mainUri: string }) {
    const { wsUriList, mainUri} = params;
    this.mainUri = mainUri;
    this.uriList = wsUriList;
    this.tempConnection();
  }

  getInstance(): Socket {
    this.startTimeMap[this.mainUri] = new Date().getTime();
    if (this.instance) {
      this.instance.disconnect();
      this.instance = null;
    }
    this.instance = io(this.mainUri, {
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
        console.log(`${this.mainUri} Connected to server`);
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

  tempConnection() {
    this.uriList.forEach(uri => {
      this.startTimeMap[uri] = new Date().getTime();
      const IO = io(uri, {
        transports: ["websocket"],
        reconnection: true, // 开启重连功能
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      IO.on("connect", () => {
        const endTime = new Date().getTime();
        const connectionTime = endTime - this.startTimeMap[uri];
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

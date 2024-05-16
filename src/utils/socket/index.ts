import { io, Socket } from 'socket.io-client';

class SingletonSocket {
  private static instance: Socket | null = null;

  constructor() { }

  // 单例模式
  public static getInstance(serverUrl: string): Socket {
    if (!SingletonSocket.instance) {
      SingletonSocket.instance = io(serverUrl, {
        transports: ['websocket'],
        reconnection: true, // 开启重连功能
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      SingletonSocket.setupSocketEvents();
    }
    return SingletonSocket.instance;
  }

  private static setupSocketEvents(): void {
    if (SingletonSocket.instance) {
      SingletonSocket.instance!.on('connect', () => {
        console.log('Connected to server');
      });
  
      SingletonSocket.instance!.on('disconnect', (reason: string) => {
        // 手动断开
        if (reason === 'io client disconnect') {
          console.log('Disconnected from server');
        } else {
          console.log('Connection lost, trying to reconnect...');
        }
      });
    }
  }

  public static disconnect(): void {
    if (SingletonSocket.instance) {
      SingletonSocket.instance.disconnect();
      SingletonSocket.instance = null;
    }
  }
}

export default SingletonSocket;

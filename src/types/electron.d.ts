declare interface Window {
  electronAPI: {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    invoke: <T>(channel: string, data?: any) => Promise<T>;
  };
}

declare interface Window {
  electronAPI: {
    openExternal: (url: string) => void;
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    invoke: <T>(channel: string, data?: any) => Promise<T>;
    getOSInfo: () => {
      platform: string;
      release: string;
      hostname: string;
    };
    getDeviceId: <T>() => Promise<T>;
  };
}

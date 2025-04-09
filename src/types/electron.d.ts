declare interface Window {
  electronAPI: {
    openExternal: (url: string) => void;
    startDownload: (url: string, savePath: string) => void;
    onDownloadProgress: (
      callback: (event: any, progress: number) => void
    ) => void;
    onDownloadComplete: (callback: (event: any, path: string) => void) => void;
    onDownloadError: (callback: (event: any, error: string) => void) => void;
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, data?: any) => void;
  };
}

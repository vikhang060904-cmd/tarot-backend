/// <reference types="vite/client" />
declare global {
  interface Window {
    FlutterBridge?: {
      postMessage: (msg: string) => void;
    };
  }
}
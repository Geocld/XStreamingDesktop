import pkg from "../../package.json";
import WebsocketIPC from "./websocket";

export default {
  // on(channel:string, listener){
  //     ipcRenderer.on(channel, listener)
  // },

  send(channel: string, action: string, data = {}) {
    if (window.XStreaming === undefined) {
      // Electron API Not available. Lets mock!
      window.XStreaming = this.websocketFallbackApi();
    }

    // console.log('DEBUG:', window.XStreaming)
    return window.XStreaming.send(channel, action, data);
  },

  on(channel: string, listener) {
    if (window.XStreaming === undefined) {
      // Electron API Not available. Lets mock!
      window.XStreaming = this.websocketFallbackApi();
    }

    // console.log('DEBUG', window.XStreaming)
    return window.XStreaming.on(channel, listener);
  },

  onAction(channel: string, action: string, listener) {
    if (window.XStreaming === undefined) {
      // Electron API Not available. Lets mock!
      window.XStreaming = this.websocketFallbackApi();
    }

    // console.log('DEBUG', window.XStreaming)
    return window.XStreaming.onAction(channel, action, listener);
  },

  removeListener(channel: string, listener) {
    if (window.XStreaming === undefined) {
      // Electron API Not available. Lets mock!
      window.XStreaming = this.websocketFallbackApi()
    }

    // console.log('DEBUG', window.XStreaming)
    return window.XStreaming.removeListener(channel, listener);
  },

  websocketFallbackApi() {
    const websocket = new WebsocketIPC(
      "ws://" + window.location.hostname + ":" + window.location.port + "/ipc"
    );

    console.log("Injecting XStreaming Websocker IPC");

    return {
      _websocket: websocket,

      send(channel, action, data) {
        // console.log('XStreamingAPI send()', channel, action, data)
        return this._websocket.send(channel, action, data);
      },
      on(channel, listener) {
        // console.log('XStreamingAPI on()', channel, listener)
        return this._websocket.on(channel, listener);
      },
      onAction(channel, action, listener) {
        // console.log('XStreamingAPI onAction()', channel, action, listener)
        return this._websocket.onAction(channel, action, listener);
      },
      removeListener(channel, listener) {
        // console.log('XStreamingAPI removeListener()', channel, listener)
        return this._websocket.removeListener(channel, listener);
      },

      getVersion() {
        return pkg.version + " (WebUI)";
      },

      openExternal(url: string) {
        window.open(url, "_blank");
      },

      isWebUI() {
        return true;
      },
    };
  },
};

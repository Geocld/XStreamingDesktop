import { app as ElectronApp, BrowserWindow, dialog } from "electron";
import serve from "electron-serve";
import Store from "electron-store";
import Debug from "debug";
import { createWindow, xboxWorker } from "./helpers";
import Authentication from "./authentication";
import Ipc from "./ipc";
import { defaultSettings } from '../renderer/context/userContext.defaults'

import xboxWebApi from "xbox-webapi";
import xCloudApi from "./helpers/xcloudapi";

import pkg from "../package.json";

interface startupFlags {
  fullscreen: boolean;
  autoStream: string;
}

export default class Application {
  private _log;
  public _store = new Store();
  private _startupFlags: startupFlags = {
    fullscreen: false,
    autoStream: "",
  };

  public _isProduction: boolean = process.env.NODE_ENV === "production";
  private _isCi: boolean = process.env.CI !== undefined;
  private _isMac: boolean = process.platform === "darwin";
  private _isWindows: boolean = process.platform === "win32";
  private _isQuitting: boolean = false;

  public _mainWindow;
  public _ipc: Ipc;
  public _authentication: Authentication;

  public streamingTokens: any

  public webToken: any

  constructor() {
    console.log(
      __filename + "[constructor()] Starting XStreaming v" + pkg.version
    );
    this._log = Debug("xstreaming");

    ElectronApp.commandLine.appendSwitch('use-vulkan')
    // ElectronApp.commandLine.appendSwitch('use-angle', 'vulkan')
    ElectronApp.commandLine.appendSwitch('enable-features', 'Vulkan,VulkanFromANGLE,DefaultANGLEVulkan,VaapiIgnoreDriverChecks,VaapiVideoDecoder,PlatformHEVCDecoderSupport,CanvasOopRasterization')
    // ElectronApp.commandLine.appendSwitch('disable-features', 'UseChromeOSDirectVideoDecoder');
    ElectronApp.commandLine.appendSwitch('enable-gpu-rasterization')
    ElectronApp.commandLine.appendSwitch('enable-oop-rasterization')
    ElectronApp.commandLine.appendSwitch('enable-accelerated-video-decode')
    ElectronApp.commandLine.appendSwitch('ozone-platform-hint', 'x11')
    ElectronApp.commandLine.appendSwitch('ignore-gpu-blocklist')
    ElectronApp.commandLine.appendSwitch('no-sandbox');
    ElectronApp.commandLine.appendSwitch('enable-zero-copy');

    this.readStartupFlags();
    this.loadApplicationDefaults();

    // ElectronApp.removeAsDefaultProtocolClient('ms-xal-public-beta-000000004c20a908')

    this._ipc = new Ipc(this);
    this._authentication = new Authentication(this);

    this._ipc.startUp();
  }

  log(namespace = "application", ...args) {
    this._log.extend(namespace)(...args);
  }

  getStartupFlags() {
    return this._startupFlags;
  }

  resetAutostream() {
    this._startupFlags.autoStream = "";
  }

  readStartupFlags() {
    this.log(
      "application",
      __filename + "[readStartupFlags()] Program args detected:",
      process.argv
    );

    for (const arg in process.argv) {
      if (process.argv[arg].includes("--fullscreen")) {
        this.log(
          "application",
          __filename +
            "[readStartupFlags()] --fullscreen switch found. Setting fullscreen to true"
        );
        this._startupFlags.fullscreen = true;
      }

      if (process.argv[arg].includes("--connect=")) {
        const key = process.argv[arg].substring(10);

        this.log(
          "application",
          __filename +
            "[readStartupFlags()] --connect switch found. Setting autoStream to",
          key
        );
        this._startupFlags.autoStream = key;
      }
    }

    this.log(
      "application",
      __filename + "[readStartupFlags()] End result of startupFlags:",
      this._startupFlags
    );
  }

  loadApplicationDefaults() {
    if (this._isProduction === true && this._isCi === false) {
      serve({ directory: "app" });
    } else if (this._isCi === true) {
      const random = Math.random() * 100;
      ElectronApp.setPath(
        "userData",
        `${ElectronApp.getPath("userData")} (${random})`
      );
      ElectronApp.setPath(
        "sessionData",
        `${ElectronApp.getPath("userData")} (${random})`
      );
      this._store.delete("user");
      this._store.delete("auth");

      serve({ directory: "app" });
    } else {
      ElectronApp.setPath(
        "userData",
        `${ElectronApp.getPath("userData")} (development)`
      );
    }

    ElectronApp.whenReady()
      .then(() => {
        this.log(
          "electron",
          __filename +
            "[loadApplicationDefaults()] Electron has been fully loaded. Ready to open windows"
        );

        this.openMainWindow();
        this._authentication.startWebviewHooks();
      })
      .catch((error) => {
        this.log(
          "electron",
          __filename +
            "[loadApplicationDefaults()] Electron has failed to load:",
          error
        );
      });

    ElectronApp.on("window-all-closed", () => {
      if (this._isMac === true) {
        this.log(
          "electron",
          __filename +
            "[loadApplicationDefaults()] Electron detected that all windows are closed. Running in background..."
        );
      } else {
        this.log(
          "electron",
          __filename +
            "[loadApplicationDefaults()] Electron detected that all windows are closed. Quitting app..."
        );
        ElectronApp.quit();
      }
    });

    ElectronApp.on("activate", () => {
      this._mainWindow !== undefined
        ? this._mainWindow.show()
        : this.openMainWindow();
    });
    ElectronApp.on("before-quit", () => (this._isQuitting = true));
  }

  _webApi: xboxWebApi;
  _xHomeApi: xCloudApi;
  _xCloudApi: xCloudApi;
  _xboxWorker: xboxWorker;

  authenticationCompleted(streamingTokens, webToken) {
    this.log(
      "electron",
      __filename + "[authenticationCompleted()] authenticationCompleted called"
    );
    this.log(
      "electron",
      __filename + "[authenticationCompleted()] streamingTokens:",
      streamingTokens
    );

    this.streamingTokens = streamingTokens
    this.webToken = webToken

    this._webApi = new xboxWebApi({
      userToken: webToken.data.Token,
      uhs: webToken.data.DisplayClaims.xui[0].uhs,
    });

    this._authentication._isAuthenticating = false;
    this._authentication._isAuthenticated = true;

    this._webApi
      .getProvider("profile")
      .get(
        "/users/me/profile/settings?settings=GameDisplayName,GameDisplayPicRaw,Gamerscore,Gamertag"
      )
      .then((result) => {
        if (result.profileUsers.length > 0) {
          for (const setting in result.profileUsers[0].settings) {
            if (result.profileUsers[0].settings[setting].id === "Gamertag") {
              this._store.set(
                "user.gamertag",
                result.profileUsers[0].settings[setting].value
              );
            } else if (
              result.profileUsers[0].settings[setting].id ===
              "GameDisplayPicRaw"
            ) {
              this._store.set(
                "user.gamerpic",
                result.profileUsers[0].settings[setting].value
              );
            } else if (
              result.profileUsers[0].settings[setting].id === "Gamerscore"
            ) {
              this._store.set(
                "user.gamerscore",
                result.profileUsers[0].settings[setting].value
              );
            }
          }
        }

        // Run workers
        this._xboxWorker = new xboxWorker(this);
        this._ipc.onUserLoaded();
      })
      .catch((error) => {
        this.log(
          "electron",
          __filename +
            "[authenticationCompleted()] Failed to retrieve user profile:",
          error
        );
        dialog.showMessageBox({
          message:
            "Error: Failed to retrieve user profile:" + JSON.stringify(error),
          type: "error",
        });
      });
  }

  openMainWindow() {
    this.log(
      "electron",
      __filename + "[openMainWindow()] Creating new main window"
    );

    const settings: any = this._store.get('settings', defaultSettings)
    console.log('application.ts settings:', settings)

    const windowOptions: any = {
      title: "XStreaming",
      backgroundColor: "rgb(26, 27, 30)",
    };

    if (settings.fullscreen) {
      windowOptions.fullscreen = true;
    }

    this._mainWindow = createWindow("main", {
      width: 1280,
      height: 800,
      ...windowOptions,
    });

    this._mainWindow.openDevTools();

    if (settings.background_keepalive) {
      this._mainWindow.webContents.setBackgroundThrottling(false);
    }

    this._mainWindow.on("show", () => {
      this.log(
        "electron",
        __filename + "[openMainWindow()] Showing Main window."
      );
    });

    this._mainWindow.on("close", (event) => {
      if (this._isMac === true && this._isQuitting === false) {
        event.preventDefault();
        this.log(
          "electron",
          __filename + "[openMainWindow()] Main windows has been hidden"
        );
        this._mainWindow.hide();
      } else {
        this.log(
          "electron",
          __filename + "[openMainWindow()] Main windows has been closed"
        );
        this._mainWindow = undefined;
      }
    });

    
    const locale = settings.locale || 'en'

    if (this._isProduction === true && this._isCi === false) {
      this._mainWindow.loadURL(`app://./${locale}/home`);
    } else {
      const port = process.argv[2] || 3000;
      this._mainWindow.loadURL(`http://localhost:${port}/${locale}/home`);

      // if(this._isCi !== true){
      //     this._mainWindow.webContents.openDevTools()
      //     this.openGPUWindow()
      // }
    }
  }

  _gpuWindow;

  openGPUWindow() {
    this._gpuWindow = new BrowserWindow({
      width: 800,
      height: 600,
    });

    // Load chrome://gpu
    this._gpuWindow.loadURL("chrome://gpu");

    // Open DevTools
    this._gpuWindow.webContents.openDevTools();
  }

  quit() {
    ElectronApp.quit();
  }

  restart() {
    this.quit();
    ElectronApp.relaunch();
  }
}

new Application();

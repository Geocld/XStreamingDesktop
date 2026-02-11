import IpcBase from "./base";
import { session } from "electron";
import { clearStreamToken } from '../helpers/streamTokenStore';
import { clearWebToken } from '../helpers/webTokenStore';
import { defaultSettings } from "../../renderer/context/userContext.defaults";

export default class IpcApp extends IpcBase {
  // _streamingSessions:any = {}

  loadCachedUser() {
    return new Promise((resolve) => {
      const user = this.getUserState();

      resolve(user);
    });
  }

  getSettings() {
    const settings: any = this._application._store.get(
      "settings",
      defaultSettings
    );
    return settings;
  }

  getUserState() {
    const gamertag = this._application._store.get("user.gamertag");
    const gamerpic = this._application._store.get("user.gamerpic");
    const gamerscore = this._application._store.get("user.gamerscore");

    const settings = this.getSettings();
    const authentication = settings.use_msal ? this._application._msalAuthentication : this._application._authentication;

    return {
      signedIn: gamertag ? true : false,
      type: "user",
      gamertag: gamertag ? gamertag : "",
      gamerpic: gamerpic ? gamerpic : "",
      gamerscore: gamerscore ? gamerscore : "",
      level: authentication._appLevel,
    };
  }

  getAuthState() {
    return new Promise((resolve) => {
      const settings = this.getSettings();
      const authentication = settings.use_msal ? this._application._msalAuthentication : this._application._authentication;
      resolve({
        isAuthenticating: authentication._isAuthenticating,
        isAuthenticated: authentication._isAuthenticated,
        user: this.getUserState(),
      });
    });
  }

  getAppLevel() {
    return new Promise((resolve) => {
      const settings = this.getSettings();
      const authentication = settings.use_msal ? this._application._msalAuthentication : this._application._authentication;
      resolve(authentication._appLevel);
    });
  }

  checkAuthentication() {
    return new Promise((resolve) => {
      const settings = this.getSettings();
      const authentication = settings.use_msal ? this._application._msalAuthentication : this._application._authentication;
      resolve(authentication.checkAuthentication());
    });
  }

  login() {
    return new Promise<boolean>(resolve => {
      this._application._authentication.startAuthflow();
      resolve(true);
    });
  }

  msalLogin() {
    return new Promise(resolve => {
      this._application._msalAuthentication.getMsalDeviceCode().then(data => {
        this._application._msalAuthentication.doPollForDeviceCodeAuth(data.device_code)
        resolve(data)
      })
    });
  }

  quit() {
    return new Promise<boolean>(resolve => {
      resolve(true);
      setTimeout(() => {
        this._application.quit();
      }, 100);
    });
  }

  restart() {
    return new Promise<boolean>(resolve => {
      resolve(true);
      setTimeout(() => {
        this._application.restart();
      }, 100);
    });
  }

  clearData() {
    return new Promise<boolean>((resolve, reject) => {
      session.defaultSession
        .clearStorageData()
        .then(() => {
          this._application._authentication._tokenStore.clear();
          this._application._msalAuthentication._tokenStore.clear();
          this._application._store.delete("user");
          this._application._store.delete("auth");

          this._application.log(
            "authentication",
            __filename +
              "[startIpcEvents()] Received restart request. Restarting application..."
          );
          this._application.restart();
          resolve(true);
        })
        .catch((error) => {
          this._application.log(
            "authentication",
            __filename +
              "[startIpcEvents()] Error: Failed to clear local storage!"
          );
          reject(error);
        });
    });
  }

  clearUserData() {
    return new Promise<boolean>((resolve, reject) => {
      session.defaultSession
        .clearStorageData()
        .then(() => {
          clearStreamToken();
          clearWebToken();
          resolve(true);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getOnlineFriends() {
    return new Promise((resolve) => {
      if (this._application._xboxWorker === undefined) {
        // Worker is not loaded yet..
        resolve([]);
      } else {
        resolve(this._application._xboxWorker._onlineFriends);
      }
    });
  }

  onUiShown() {
    return new Promise((resolve) => {
      resolve({});
    });
  }

  isFullscreen() {
    return new Promise((resolve) => {
      const isFullScreen = this._application._mainWindow.isFullScreen();
      resolve(isFullScreen)
    }); 
  }

  toggleFullscreen() {
    return new Promise((resolve) => {
      const isFullScreen = this._application._mainWindow.isFullScreen();
      this._application._mainWindow.setFullScreen(!isFullScreen);
      resolve({})
    });
  }

  enterFullscreen() {
    return new Promise((resolve) => {
      this._application._mainWindow.setFullScreen(true);
      resolve({})
    });
  }

  exitFullscreen() {
    return new Promise((resolve) => {
      this._application._mainWindow.setFullScreen(false);
      resolve({})
    });
  }

  getStartupFlags() {
    return new Promise((resolve) => {
      resolve(this._application.getStartupFlags());
    });
  }

  resetAutoConnect() {
    return new Promise((resolve) => {
      this._application.resetAutoConnect();
      resolve({});
    });
  }
}

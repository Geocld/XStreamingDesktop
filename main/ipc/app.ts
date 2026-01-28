import IpcBase from "./base";
import { session } from "electron";
import { clearStreamToken } from '../helpers/streamTokenStore';
import { clearWebToken } from '../helpers/webTokenStore';

// const HID = require('node-hid')

// const devices = HID.devices()
// const xbox = devices.find(d => d.vendorId === 0x045e)

// const device = new HID.HID(xbox.path);

const states = {
  a: 0
}

// device.on('data', data => {
//   states.a = data[2]
//   console.log('data:', data[2], states)
// });

export default class IpcApp extends IpcBase {
  // _streamingSessions:any = {}

  loadCachedUser() {
    return new Promise((resolve) => {
      const user = this.getUserState();

      resolve(user);
    });
  }

  getUserState() {
    const gamertag = this._application._store.get("user.gamertag");
    const gamerpic = this._application._store.get("user.gamerpic");
    const gamerscore = this._application._store.get("user.gamerscore");

    return {
      signedIn: gamertag ? true : false,
      type: "user",
      gamertag: gamertag ? gamertag : "",
      gamerpic: gamerpic ? gamerpic : "",
      gamerscore: gamerscore ? gamerscore : "",
      level: this._application._authentication._appLevel,
    };
  }

  getAuthState() {
    return new Promise((resolve) => {
      resolve({
        isAuthenticating: this._application._authentication._isAuthenticating,
        isAuthenticated: this._application._authentication._isAuthenticated,
        user: this.getUserState(),
      });
    });
  }

  getAppLevel() {
    return new Promise((resolve) => {
        resolve(this._application._authentication._appLevel);
    });
  }

  checkAuthentication() {
    return new Promise((resolve) => {
      resolve(this._application._authentication.checkAuthentication());
    });
  }

  login() {
    return new Promise<boolean>((resolve) => {
      this._application._authentication.startAuthflow();
      resolve(true);
    });
  }

  quit() {
    return new Promise<boolean>((resolve) => {
      resolve(true);
      setTimeout(() => {
        this._application.quit();
      }, 100);
    });
  }

  restart() {
    return new Promise<boolean>((resolve) => {
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

  hidController() {
    return new Promise((resolve) => {
      resolve({
        states
      })
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

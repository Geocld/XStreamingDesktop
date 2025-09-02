import IpcBase from "./base";
import Application from "../application";
import TitleManager from "../helpers/titlemanager";
import AchivementManager from "../helpers/achivementmanager";
import xCloudApi from "../helpers/xcloudapi";

export default class IpcxCloud extends IpcBase {
  _titleManager: TitleManager;
  _achivementManager: AchivementManager;

  _titlesAreLoaded = false;

  _titles = [];
  _titlesLastUpdate = 0;

  _recentTitles = [];
  _recentTitlesLastUpdate = 0;

  _newTitles = [];
  _newTitlesLastUpdate = 0;

  constructor(application: Application) {
    super(application);

    this._titleManager = new TitleManager(application);
    this._achivementManager = new AchivementManager(application);
  }

  startUp() {
    this._application.log("Ipc:xCloud", "Starting xCloud IPC Channel...");
  }

  getRecentTitles() {
    const streamingTokens = this._application.streamingTokens;

    let _xCloudApi = new xCloudApi(
      this._application,
      'ckr.core.gssv-play-prod.xboxlive.com',
      '',
      'cloud'
    );

    if (streamingTokens.xCloudToken) {
      _xCloudApi = new xCloudApi(
        this._application,
        streamingTokens.xCloudToken.getDefaultRegion().baseUri.substring(8),
        streamingTokens.xCloudToken.data.gsToken,
        'cloud'
      );
    }
    
    return _xCloudApi.getRecentTitles();
  }

  getXhomeToken() {
    console.log("getXhomeToken");
    return new Promise((resolve) => {
      if (
        this._application.streamingTokens &&
        this._application.streamingTokens.xHomeToken
      ) {
        resolve(this._application.streamingTokens.xHomeToken.data);
      } else {
        resolve(null);
      }
    });
  }

  setXhomeTokenDefault(name: string) {
    return new Promise((resolve) => {
      this._application.streamingTokens.xHomeToken.setDefaultRegion(name);
      resolve(null);
    });
  }

  getXcloudToken() {
    console.log("getXcloudToken");
    return new Promise((resolve) => {
      if (
        this._application.streamingTokens &&
        this._application.streamingTokens.xCloudToken
      ) {
        resolve(this._application.streamingTokens.xCloudToken.data);
      } else {
        resolve(null);
      }
    });
  }

  setXcloudTokenDefault(name: string) {
    return new Promise((resolve) => {
      if (this._application.streamingTokens.xCloudToken) {
        this._application.streamingTokens.xCloudToken.setDefaultRegion(name);
      }
      resolve({});
    });
  }

  getTitles() {
    const streamingTokens = this._application.streamingTokens;
    const _xCloudApi = new xCloudApi(
      this._application,
      streamingTokens.xCloudToken.getDefaultRegion().baseUri.substring(8),
      streamingTokens.xCloudToken.data.gsToken,
      "cloud"
    );
    return new Promise((resolve, reject) => {
      _xCloudApi
        .getTitles()
        .then((titles: any) => {
          resolve(titles);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  getGamePassProducts(titles: any) {
    return this._titleManager.getGamePassProducts(titles);
  }

  getNewTitles() {
    return this._titleManager.getNewTitles();
  }

  getHistoryAchivements() {
    return this._achivementManager.getHistoryAchivements();
  }

  getAchivementDetail(titleId: string) {
    return this._achivementManager.getAchivementDetail(titleId);
  }
}

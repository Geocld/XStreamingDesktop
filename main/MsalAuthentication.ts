import { dialog } from "electron";
import Application from "./application";
import { Msal } from "./xal";
import AuthTokenStore from "./helpers/tokenstore";
import { defaultSettings } from "../renderer/context/userContext.defaults";

export default class Authentication {
  _application: Application;

  _tokenStore: AuthTokenStore;
  _msal: Msal;

  _authWindow;
  _authCallback;

  _isAuthenticating: boolean = false;
  _isAuthenticated: boolean = false;
  _appLevel: number = 0;

  constructor(application: Application) {
    this._application = application;
    this._tokenStore = new AuthTokenStore();
    this._tokenStore.load();
    this._msal = new Msal(this._tokenStore);
  }

  checkAuthentication() {
    this._application.log(
      "authenticationV2",
      "[checkAuthentication()] Starting token check...",
    );
    if (this._tokenStore.hasValidAuthTokens()) {
      // Deprecate xal token.
      if (
        this._tokenStore.getUserToken() !== undefined &&
        this._tokenStore.getUserToken().data.scope != "XboxLive.signin"
      ) {
        this._application.log(
          "authenticationV2",
          "[checkAuthentication()] Deprecating old XAL token scope. Starting auth flow to get new tokens.",
        );
        return false;
      }

      this._application.log(
        "authenticationV2",
        "[checkAuthentication()] Tokens are valid:",
        this._tokenStore.getUserToken(),
      );
      this.startSilentFlow();

      return true;
    } else {
      if (this._tokenStore.getUserToken() !== undefined) {
        // We have a user token, lets try to refresh it.
        this._application.log(
          "authenticationV2",
          "[checkAuthentication()] Tokens are expired but we have a user token. Lets try to refresh the tokens.",
        );
        this.startSilentFlow();

        return true;
      } else {
        this._application.log(
          "authenticationV2",
          "[checkAuthentication()] No tokens are present.",
        );
        return false;
      }
    }
  }

  startSilentFlow() {
    this._application.log(
      "authenticationV2",
      "[startSilentFlow()] Starting silent flow...",
    );
    this._isAuthenticating = true;

    const settings: any = this._application._store.get(
      "settings",
      defaultSettings
    );

    const forceRegionIp = settings.force_region_ip;
    if (
      forceRegionIp &&
      typeof forceRegionIp === "string" &&
      forceRegionIp.trim() !== ""
    ) {
      this._msal.setDefaultHeaders({ "X-Forwarded-For": forceRegionIp.trim() });
      this._application.log(
        "authenticationV2",
        "[startSilentFlow()] Using X-Forwarded-For:",
        forceRegionIp,
      );
    } else {
      this._msal.setDefaultHeaders({});
    }

    this.getTokens();
  }

  getTokens() {
    this.getStreamingToken()
      .then((streamingTokens) => {
        this._application.log(
          "authenticationV2",
          "[getTokens()] Retrieved streaming tokens:",
          streamingTokens,
        );

        if (streamingTokens.xCloudToken !== undefined) {
          this._application.log(
            "authenticationV2",
            "[getTokens()] Retrieved both xHome and xCloud tokens",
          );
          this._appLevel = 2;
        } else {
          this._application.log(
            "authenticationV2",
            "[getTokens()] Retrieved xHome token only",
          );
          this._appLevel = 1;
        }

        this._msal
          .getWebToken()
          .then((webToken) => {
            this._application.log(
              "authenticationV2",
              __filename + "[getTokens()] Web token received",
            );
            this._application.authenticationCompleted(
              streamingTokens,
              webToken,
            );
          })
          .catch((error) => {
            this._application.log(
              "authenticationV2",
              __filename + "[getTokens()] Failed to retrieve web tokens:",
              error,
            );
            dialog.showMessageBox({
              message:
                "failedToRetrieveWebTokens" +
                " " +
                JSON.stringify(error),
              type: "error",
            });
          });
      })
      .catch((err) => {
        this._application.log(
          "authenticationV2",
          "[startSilentFlow()] Failed to retrieve streaming tokens:",
          err,
        );
        dialog.showMessageBox({
          message:
            "failedToRetrieveStreamingTokens" +
            " " +
            JSON.stringify(err),
          type: "error",
        });
      });
  }

  getMsalDeviceCode() {
    this._application.log(
      "authenticationV2",
      "[getMsalDeviceCode()] Starting get device code",
    );

    const settings: any = this._application._store.get(
      "settings",
      defaultSettings
    );

    const forceRegionIp = settings.force_region_ip;
    if (
      forceRegionIp &&
      typeof forceRegionIp === "string" &&
      forceRegionIp.trim() !== ""
    ) {
      this._msal.setDefaultHeaders({ "X-Forwarded-For": forceRegionIp.trim() });
      this._application.log(
        "authenticationV2",
        "[getMsalDeviceCode()] Using X-Forwarded-For:",
        forceRegionIp,
      );
    } else {
      this._msal.setDefaultHeaders({});
    }

    return this._msal.doDeviceCodeAuth()
  }

  doPollForDeviceCodeAuth(deviceCode) {
    this._isAuthenticating = true;

    this._msal
      .doPollForDeviceCodeAuth(deviceCode)
      .then((token) => {
        this._application.log(
          "authenticationV2",
          "[doPollForDeviceCodeAuth()] Devicecode authentication successful:",
          token,
        );

        this.getTokens();
      })
      .catch((error) => {
        this._application.log(
          "authenticationV2",
          "[doPollForDeviceCodeAuth()] Error during devicecode polling auth:",
          error,
        );
        dialog.showErrorBox(
          "Error",
          "Failed to perform MSAL authentixation: " + JSON.stringify(error),
        );

        this._isAuthenticating = false;
      });
  }

  startAuthflow() {
    this._application.log(
      "authenticationV2",
      "[startAuthflow()] Starting authentication flow",
    );

    const settings: any = this._application._store.get(
      "settings",
      defaultSettings
    );

    const forceRegionIp = settings.force_region_ip;
    if (
      forceRegionIp &&
      typeof forceRegionIp === "string" &&
      forceRegionIp.trim() !== ""
    ) {
      this._msal.setDefaultHeaders({ "X-Forwarded-For": forceRegionIp.trim() });
      this._application.log(
        "authenticationV2",
        "[startSilentFlow()] Using X-Forwarded-For:",
        forceRegionIp,
      );
    } else {
      this._msal.setDefaultHeaders({});
    }

    this._msal
      .doDeviceCodeAuth()
      .then((data) => {
        this._application.log(
          "authenticationV2",
          "[startAuthflow()] Starting devicecode auth:",
          data,
        );

        dialog.showMessageBox({
          message: data.message + " Click OK to continue after entering code.",
          type: "info",
        });

        this._isAuthenticating = true;

        this._msal
          .doPollForDeviceCodeAuth(data.device_code)
          .then((token) => {
            console.log('doPollForDeviceCodeAuth success22222', token)
            this._application.log(
              "authenticationV2",
              "[startAuthflow()] Devicecode authentication successful:",
              token,
            );

            this.getTokens();
          })
          .catch((error) => {
            this._application.log(
              "authenticationV2",
              "[startAuthflow()] Error during devicecode polling auth:",
              error,
            );
            dialog.showErrorBox(
              "Error",
              "Failed to perform MSAL authentixation: " + JSON.stringify(error),
            );

            this._isAuthenticating = false;
          });
      })
      .catch((error) => {
        this._application.log(
          "authenticationV2",
          "[startAuthflow()] Error during devicecode auth:",
          error,
        );
        dialog.showErrorBox(
          "Error",
          "errorAuthentificationUser" +
            " " +
            JSON.stringify(error),
        );
      });
  }

  async getStreamingToken() {
    const userToken = this._tokenStore.getUserToken();
    if (userToken === undefined)
      throw new Error("sisuTokenIsMissing");

    this._application.log(
      "authenticationV2",
      "[getStreamingToken()] Found local token:",
      userToken,
    );

    const streamingTokens = await this._msal.getStreamingTokens();
    this._application.log(
      "authenticationV2",
      "[getStreamingToken()] Retrieved streaming tokens:",
      streamingTokens,
    );

    return {
      xHomeToken: streamingTokens.xHomeToken,
      xCloudToken: streamingTokens.xCloudToken,
    };
    // return { xHomeToken: streamingTokens.xHomeToken, xCloudToken: undefined }
  }
}

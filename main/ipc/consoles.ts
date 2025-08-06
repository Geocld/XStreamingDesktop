import Http from '../helpers/xhttp'
import IpcBase from './base'

import UUID from 'uuid-1345'
const nextUUID = () => UUID.v3({ namespace: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: Date.now().toString() })

export default class IpcConsoles extends IpcBase {
    // _streamingSessions:any = {}

    _consoles = []
    _consolesLastUpdate = 0

    sendCommand (
        consoleId: string,
        commandType: string,
        command: string,
        params?: any,
    ) {
        console.log('[sendCommand]:', consoleId, commandType, command);
        const http = new Http();

        if (params === undefined) {
          params = [];
        }

        const postParams = {
          destination: 'Xbox',
          type: commandType,
          command: command,
          sessionId: nextUUID(),
          sourceId: 'com.microsoft.smartglass',
          parameters: params,
          linkedXboxId: consoleId,
        };

        return new Promise((resolve) => {
          http
            .post(
              'xccs.xboxlive.com',
              '/commands',
              {
                Authorization:
                  'XBL3.0 x=' +
                  this._application.webToken.data.DisplayClaims.xui[0].uhs +
                  ';' +
                  this._application.webToken.data.Token,
                'Accept-Language': 'en-US',
                skillplatform: 'RemoteManagement',
                'x-xbl-contract-version': '4',
                'x-xbl-client-name': 'XboxApp',
                'x-xbl-client-type': 'UWA',
                'x-xbl-client-version': '39.39.22001.0',
              },
              postParams,
            )
            .then((res: any) => {
              console.log('[sendCommand] /commands/ response:', JSON.stringify(res));
              if (res.result) {
                resolve(res.result);
              } else {
                resolve([]);
              }
            })
            .catch(() => {
              resolve([]);
              // reject(e);
            });
        });
    }

    get(){
        return new Promise((resolve, reject) => {
            if(this._consolesLastUpdate < Date.now() - 60*1000){
                // this._application._events._webApi.getProvider('smartglass').getConsolesList().then((consoles) => {
                this._application._webApi.getProvider('smartglass').getConsolesList().then(consoles => {
                    this._consoles = consoles.result
                    this._consoles.forEach((item: any) => {
                      item.serverId = item.id;
                      item.deviceName = item.name;
                    });
                    this._consolesLastUpdate = Date.now()

                    resolve(this._consoles)
                }).catch((error) => {
                    reject(error)
                })
            } else {
                resolve(this._consoles)
            }
        })
    }

    powerOn(consoleId: string) {
        return new Promise((resolve, reject) => {
            this.sendCommand(consoleId, 'Power', 'WakeUp').then(res => {
                resolve(res)
            }).catch(e => {
                reject(e)
            })
        });
    }

    sendText(params) {
      const { consoleId, text } = params
      return this.sendCommand(consoleId, 'Shell', 'InjectString', [
        {
          replacementString: text,
        },
      ]);
    }

    powerOff(consoleId: string) {
        return new Promise((resolve, reject) => {
            this.sendCommand(consoleId, 'Power', 'TurnOff').then(res => {
                resolve(res)
            }).catch(e => {
                reject(e)
            })
        });
    }
}
import Application from '../application'
import xCloudApi, { playResult } from './xcloudapi'
import { defaultSettings } from "../../renderer/context/userContext.defaults"

interface streamSession {
    id: string;
    target: string;
    path: string;
    type: string|'home'|'cloud';
    state?: string;
    waitingTimes?: any;
    playerState: string|'pending'|'started'|'queued'|'failed';
    errorDetails?: {
        code;
        message;
    };
}

export default class StreamManager {

    _application:Application

    _sessions = {}
    
    constructor(application){
        this._application = application
    }

    getApi(type): xCloudApi{
        const streamingTokens = this._application.streamingTokens;

        if(type === 'home') {
            return new xCloudApi(
                this._application,
                streamingTokens.xHomeToken.getDefaultRegion().baseUri.substring(8),
                streamingTokens.xHomeToken.data.gsToken,
                "home"
            );
        } else {
            return new xCloudApi(
                this._application,
                streamingTokens.xCloudToken.getDefaultRegion().baseUri.substring(8),
                streamingTokens.xCloudToken.data.gsToken,
                "cloud"
            );
        }
    }

    getSession(sessionId:string):streamSession {
        return this._sessions[sessionId]
    }

    startStream(type:string|'home'|'cloud', target){
        return new Promise((resolve, reject) => {
            this.getApi(type).startStream(target).then((playResult:playResult) => {
            // this._application._xCloudApi.startStream(type, target).then((playResult) => {
                console.log('Streammanager - startStream:', playResult)

                const sessionId = playResult.sessionPath.split('/')[3]

                const streamSession:streamSession = {
                    id: sessionId,
                    target: target,
                    path: playResult.sessionPath,
                    type: type,
                    playerState: 'pending',
                }
                this._sessions[sessionId] = streamSession
                this.monitorSession(sessionId)

                resolve(sessionId)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    stopStream(sessionId){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            this.getApi(session.type).stopStream(sessionId).then((result) => {
                console.log('Current sessions:', this._sessions)
                delete this._sessions[sessionId]
                console.log('new sessions:', this._sessions)

                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendSdp(sessionId:string, sdp:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            this.getApi(session.type).sendSdp(sessionId, sdp).then((result) => {

                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendChatSdp(sessionId:string, sdp:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            this.getApi(session.type).sendChatSdp(sessionId, sdp).then((result) => {

                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendIce(sessionId:string, ice:any){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            this.getApi(session.type).sendIce(sessionId, ice).then((result) => {

                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    sendKeepalive(sessionId:string){
        return new Promise((resolve, reject) => {
            const session = this.getSession(sessionId)
            if(session === undefined){
                reject('Session not found: '+sessionId)
                return
            }

            this.getApi(session.type).sendKeepalive(sessionId).then((result) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    monitorSession(sessionId){
        setTimeout(() => {
            this._application.log('StreamManager', 'monitorSession('+sessionId+') checking state')

            const session = this.getSession(sessionId)
            if(session === undefined){
                this._application.log('StreamManager', 'monitorSession('+sessionId+') session not found')
                return
            }
            this.getApi(this.getSession(sessionId).type).getStreamState(sessionId).then((result:any) => {
                console.log('Streammanager - state:', result)

                this.getSession(sessionId).state = result.state

                if(result.state === 'Provisioned'){
                    this.getSession(sessionId).playerState = 'started'

                } else if(result.state === 'Provisioning'){
                    // Lets loop again
                    this.monitorSession(sessionId)

                } else if(result.state === 'ReadyToConnect'){
                    // Do MSAL Auth
                    // @TODO: Refresh token if expired?
                    const settings: any = this._application._store.get(
                        "settings",
                        defaultSettings
                    );
                    if(settings.use_msal) {
                        this._application._msalAuthentication._msal.getMsalToken().then((msalToken) => {
                            this.getApi(this.getSession(sessionId).type).sendMSALAuth(sessionId, msalToken.data.lpt).then(() => {
                                this.monitorSession(sessionId)

                            }).catch((error) => {
                                console.log('MSAL AUTH Error:', error)
                                alert('MSAL AUTH Error:'+ error)
                            })
                        }).catch((error) => {
                            console.log('MSAL AUTH Error:', error)
                            alert('MSAL AUTH Error:'+ error)
                        })
                    } else {
                        this._application._authentication._xal.getMsalToken(this._application._authentication._tokenStore).then((msalToken) => {
                            this.getApi(this.getSession(sessionId).type).sendMSALAuth(sessionId, msalToken.data.lpt).then(() => {
                                this.monitorSession(sessionId)

                            }).catch((error) => {
                                console.log('MSAL AUTH Error:', error)
                                alert('MSAL AUTH Error:'+ error)
                            })
                        }).catch((error) => {
                            console.log('MSAL AUTH Error:', error)
                            alert('MSAL AUTH Error:'+ error)
                        })
                    }
                    

                } else if(result.state === 'WaitingForResources'){
                    // Do Queue logic
                    if(this.getSession(sessionId).waitingTimes === undefined){
                        this.getApi(this.getSession(sessionId).type).getWaitingTimes(this.getSession(sessionId).target).then((waitingTimes) => {
                            this.getSession(sessionId).waitingTimes = waitingTimes
                            this.getSession(sessionId).playerState = 'queued'

                        })
                    }
                    
                    this.monitorSession(sessionId)

                } else if(result.state === 'Failed'){
                    this.getSession(sessionId).errorDetails = result.errorDetails
                    this.getSession(sessionId).playerState = 'failed'

                } else {
                    
                    console.log('Unknown state:', result)
                }

            }).catch((error) => {
                console.log('Streammanager - error checking state:', sessionId, error)

                if(error.status === 404){
                    this._application.log('StreamManager', 'Session not found on server. Removing session...')
                    delete this._sessions[sessionId]
                } else {
                    this.monitorSession(sessionId)
                }
            })
        }, 1000)
    }

    getActiveSessions(){
        return new Promise((resolve, reject) => {
            this.getApi('cloud').getActiveSessions().then((result) => {

                console.log('Active sessions:', result)
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
        })
    }

    inputConfigs(xboxTitleId: string) {
        return new Promise((resolve, reject) => {
            this.getApi('home').inputConfigs(xboxTitleId).then((res) => {
                console.log('inputConfigs res:', res)

                resolve('')
            }).catch((error) => {
                reject(error)
            })
        })
    }

    getConsoles() {
        return new Promise((resolve) => {
            this.getApi('home').getConsoles().then((result) => {
                resolve(result)
            }).catch(() => {
                resolve([])
            })
        })
    }
}
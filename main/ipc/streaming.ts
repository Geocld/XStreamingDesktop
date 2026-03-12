import IpcBase from './base'
import Application from '../application'
import StreamManager from '../helpers/streammanager'

interface startStreamArgs {
    type: string;
    target: string;
    gameName?: string;
    gameImageUrl?: string;
}

interface sendSdpArgs {
    sessionId: string;
    sdp: any;
}

interface sendIceArgs {
    sessionId: string;
    ice: any;
}
interface sendKeepaliveArgs {
    sessionId: string;
}
interface stopStreamArgs {
    sessionId: string;
}
interface getPlayerStateArgs {
    sessionId: string;
}

export default class IpcStreaming extends IpcBase {

    _streamManager: StreamManager

    constructor(application: Application) {
        super(application)

        this._streamManager = new StreamManager(application)
    }

    startStream(args: startStreamArgs) {

        if (args.type === 'home') {
            this._application._ipc._channels.consoles._consolesLastUpdate = 0
        } else {
            this._application._ipc._channels.xCloud._recentTitlesLastUpdate = 0
        }

        if (this._application._discordRpc) {
            const gameName = args.gameName || (args.type === 'home' ? 'Xbox Console' : 'Xbox Game')
            const gameImage = args.gameImageUrl || ''
            this._application._discordRpc.setPlaying(gameName, gameImage)
        }

        return this._streamManager.startStream(args.type, args.target)
    }

    stopStream(args: stopStreamArgs) {
        if (this._application._discordRpc) {
            this._application._discordRpc.clearPlaying()
        }

        return this._streamManager.stopStream(args.sessionId)
    }

    sendSdp(args: sendSdpArgs) {
        return this._streamManager.sendSdp(args.sessionId, args.sdp)
    }

    sendChatSdp(args: sendSdpArgs) {
        return this._streamManager.sendChatSdp(args.sessionId, args.sdp)
    }

    sendIce(args: sendIceArgs) {
        return this._streamManager.sendIce(args.sessionId, args.ice)
    }

    sendKeepalive(args: sendKeepaliveArgs) {
        return this._streamManager.sendKeepalive(args.sessionId)
    }

    getPlayerState(args: getPlayerStateArgs) {
        return new Promise((resolve) => {
            resolve(this._streamManager.getSession(args.sessionId))
        })
    }

    activeSessions() {
        return this._streamManager.getActiveSessions()
    }

    inputConfigs(args: any) {
        return this._streamManager.inputConfigs(args.xboxTitleId)
    }

    getConsoles() {
        return this._streamManager.getConsoles()
    }

}

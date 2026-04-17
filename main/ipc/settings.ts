import IpcBase from './base'
import { defaultSettings } from '../../renderer/context/userContext.defaults'

export default class IpcSettings extends IpcBase {

    setSettings(args:(typeof defaultSettings)){
        return new Promise((resolve) => {
            const oldSettings = this._application._store.get('settings', defaultSettings) as any
            const newSettings = {...defaultSettings, ...args}
            this._application._store.set('settings', newSettings)

            const rpcEnabled = (newSettings as any).discord_rpc
            const rpcWasEnabled = (oldSettings as any).discord_rpc

            if (rpcEnabled && !rpcWasEnabled) {
                this._application._discordRpc.enable()
            } else if (!rpcEnabled && rpcWasEnabled) {
                this._application._discordRpc.disable()
            }

            resolve(newSettings)
        })
    }

    getSettings(){
        return new Promise<typeof defaultSettings>((resolve) => {
            const settings = this._application._store.get('settings', defaultSettings) as object
            resolve({...defaultSettings, ...settings})
        })
    }

    resetSettings() {
        return new Promise((resolve) => {
            const settings = {...defaultSettings}
            this._application._store.delete('settings')

            this._application._store.set('settings', settings)

            if (settings.discord_rpc !== false) {
                this._application._discordRpc.enable()
            } else {
                this._application._discordRpc.disable()
            }

            resolve(settings)
        })
    }
}
import { TokenStore } from '../xal'
import Store from 'electron-store'

export default class AuthTokenStore extends TokenStore {

    private _store = new Store()

    load() {
        const tokens = this._store.get('user.tokenstore', '{}') as string
        this.loadJson(tokens)

        return true
    }

    save() {
        const data = JSON.stringify({
            userToken: this._userToken?.data,
            sisuToken: this._sisuToken?.data,
            jwtKeys: this._jwtKeys,
            tokenUpdateTime: Date.now(),
        })

        this._store.set('user.tokenstore', data)
    }

    getTokenUpdateTime() {
        const tokens = this._store.get('user.tokenstore', '{}') as string
        this.loadJson(tokens)
        return this._tokenUpdateTime;
    }

    clear() {
        this._store.delete('user.tokenstore')
        this._userToken = undefined
        this._sisuToken = undefined
        this._jwtKeys = undefined
    }
}
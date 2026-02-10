import SisuToken from './lib/tokens/sisutoken'
import UserToken from './lib/tokens/usertoken'
import fs from 'fs'

export default class TokenStore {

    _filepath:string = ''

    // Main tokens
    _userToken:UserToken | undefined
    _sisuToken:SisuToken | undefined
    _jwtKeys:any
    _tokenUpdateTime: number

    // Sub-Tokens
    load(filepath:string, silent = false) {
        this._filepath = filepath

        if(fs.existsSync(filepath)){
            const fileContents = fs.readFileSync(filepath)
            return this.loadJson(fileContents.toString())
        } else {
            if(! silent){
                throw new Error('TokenStore: File not found: ' + filepath)
            }
        }

        return false
    }

    loadJson(json:string) {
        const jsonData:{ userToken:any, sisuToken:any, jwtKeys:any, tokenUpdateTime: any } = JSON.parse(json)

        if(jsonData.userToken){
            this._userToken = new UserToken(jsonData.userToken)
        }

        if(jsonData.sisuToken){
            this._sisuToken = new SisuToken(jsonData.sisuToken)
        }

        if(jsonData.jwtKeys){
            this._jwtKeys = jsonData.jwtKeys
        }

        if(jsonData.tokenUpdateTime){
            this._tokenUpdateTime = jsonData.tokenUpdateTime
        }

        return true
    }

    setUserToken(userToken:UserToken) {
        const expireDate = new Date()
        expireDate.setSeconds(expireDate.getSeconds() + userToken.data.expires_in)

        this._userToken = new UserToken({ ...userToken.data, expires_on: expireDate.toISOString() })
    }

    getUserToken() {
        return this._userToken
    }

    setSisuToken(sisuToken:SisuToken) {
        this._sisuToken = new SisuToken(sisuToken.data)
    }

    getSisuToken() {
        return this._sisuToken
    }

    setJwtKeys(jwtKeys:any) {
        this._jwtKeys = jwtKeys
    }

    save() {
        const data = {
            userToken: this._userToken?.data,
            sisuToken: this._sisuToken?.data,
            jwtKeys: this._jwtKeys
        }

        fs.writeFileSync(this._filepath, JSON.stringify(data, null, 2))
    }

    removeAll() {
        fs.writeFileSync(this._filepath, JSON.stringify({}))
    }

    hasValidAuthTokens() {
        if(this._userToken){
            if(! this._userToken.isValid()){
                return false
            }
        } else {
            return false
        }

        if(this._sisuToken){
            if(! this._userToken.isValid()){
                return false
            }
        } else {
            return false
        }

        return true
    }

    getAuthenticationMethod():'xal'|'msal'|'none' {
        if(this._sisuToken){
            return 'xal'
        } else if(this._userToken){
            return 'msal'
        } else {
            return 'none'
        }
    }
}
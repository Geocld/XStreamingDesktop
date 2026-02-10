import Token from '../token'

export interface IUserToken {
    token_type: string
    expires_in: number
    scope: string
    access_token: string
    refresh_token: string

    // xal
    user_id?: string
    expires_on?: string

    // msal
    ext_expires_in?: number
    id_token?: string
}

export default class UserToken extends Token {
    data: IUserToken

    constructor(data: IUserToken) {
        super(data)
        this.data = data
    }

    calculateSecondsLeft(date:Date) {
        const expiresOn = date
        const currentDate = new Date()
        return Math.floor((expiresOn.getTime() - currentDate.getTime()) / 1000)
    }

    getSecondsValid() {
        if(this.data.expires_on) {
            return this.calculateSecondsLeft(new Date(this.data.expires_on))
        }
        
        return -1
    }

    isValid() {
        if(this.data.expires_on) {
            const secondsLeft = this.calculateSecondsLeft(new Date(this.data.expires_on))
            return secondsLeft > 0
        }

        return false
    }
}
export default class Token {
    data: any

    constructor(data: any) {
        this.data = data
    }

    calculateSecondsLeft(date: Date){
        const expiresOn = date
        const currentDate = new Date()
        return Math.floor(((expiresOn.getTime() || 0) - currentDate.getTime()) / 1000)
    }

    getSecondsValid(): number {
        console.log('Warning: getSecondsValid not implemented')

        return 0
    }

    isValid(): boolean { 
        console.log('Warning: isValid not implemented')

        return false
    }

    getUserHash(): any {
        if('UserToken' in this.data){
            return this.data.UserToken.DisplayClaims.xui[0].uhs
        }

        return false
    }

    getGamertag(): any {
        if('AuthorizationToken' in this.data){
            return this.data.AuthorizationToken.DisplayClaims.xui[0].gtg
        }

        return false
    }
}
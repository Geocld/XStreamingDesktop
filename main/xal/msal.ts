import Http from './lib/http'
import XstsToken from './lib/tokens/xststoken'
import UserToken from './lib/tokens/usertoken'
import StreamingToken from './lib/tokens/streamingtoken'
import TokenStore from './tokenstore'
import MsalToken from './lib/tokens/msaltoken'

class TokenRefreshError implements Error {
    name = 'TokenRefreshError'
    message = 'Unknown error'

    constructor(message:string, public error?:any){
        this.message = message
        this.error = error
    }
}

export interface IDeviceCodeAuth {
    user_code: string
    device_code: string
    verification_uri: string
    expires_in: number
    interval: number
    message: string
}

export interface IDeviceCodeVerify {
    access_token: string
    expires_in: number
    ext_expires_in: number
    id_token: string
    refresh_token: string
    scope: string
    token_type: string
}

export default class Msal {

    private _tokenStore:TokenStore
    private _clientId = '1f907974-e22b-4810-a9de-d9647380c97e'
    private _httpClient:Http = new Http()

    private _xstsToken:XstsToken | undefined
    private _gssvToken:XstsToken | undefined


    
    constructor(tokenStore:TokenStore){
        this._tokenStore = tokenStore
    }

    setDefaultHeaders(headers:Record<string, string>){
        this._httpClient.setDefaultHeaders(headers)
    }

    /**
     * Creates a new device code authentication request.
     */
    doDeviceCodeAuth(){
        return new Promise<IDeviceCodeAuth>((resolve, reject) => {
            this._httpClient.postRequest('login.microsoftonline.com', '/consumers/oauth2/v2.0/devicecode', {
                "Content-Type": "application/x-www-form-urlencoded"
            }, "client_id="+this._clientId+"&scope=xboxlive.signin%20openid%20profile%20offline_access").then((response) => {
                resolve(response.body())

            }).catch((error) => {
                reject(error)
            })
        })
    }

    /**
     * Keeps polling for authentication changes. The promise will be fullfilled once the user has authenticated.
     */
    doPollForDeviceCodeAuth(deviceCode:string, timeout = 900 * 1000, startTime = Date.now()){
        return new Promise<IDeviceCodeVerify>((resolve, reject) => {
            this._httpClient.postRequest('login.microsoftonline.com', '/consumers/oauth2/v2.0/token', {
                "Content-Type": "application/x-www-form-urlencoded"
            }, "grant_type=urn:ietf:params:oauth:grant-type:device_code&client_id="+this._clientId+"&device_code="+deviceCode
            ).then((response) => {
                const body = response.body()
                const userToken = new UserToken(body)

                this._tokenStore.removeAll()
                this._tokenStore.setUserToken(userToken)
                this._tokenStore.save()
                resolve(body)

            }).catch((error) => {
                if (Date.now() - startTime >= timeout) {
                    reject(new Error('doPollForDeviceCodeAuth timeout'));
                    return;
                }
                setTimeout(() => {
                    this.doPollForDeviceCodeAuth(deviceCode, timeout, startTime).then((response) => {
                        resolve(response)
                    }).catch((error) => {
                        reject(error)
                    })
                }, 1000)
            })
        });
    }

    getMsalToken(){
        return new Promise<MsalToken>((resolve, reject) => {
            this.getOrRefreshUserToken().then((userToken) => {
                const refreshToken = this._tokenStore.getUserToken()?.data.refresh_token

                if(refreshToken === undefined){
                    reject('No refresh token found. Please authenticate first.')
                    return
                }

                this._httpClient.postRequest('login.live.com', '/oauth20_token.srf', {
                    "Content-Type": "application/x-www-form-urlencoded"
                }, "client_id="+this._clientId+"&scope=service::http://Passport.NET/purpose::PURPOSE_XBOX_CLOUD_CONSOLE_TRANSFER_TOKEN&grant_type=refresh_token&refresh_token="+refreshToken
                ).then((response) => {
                    const body = response.body()

                    const msalToken = new MsalToken({
                        lpt: body.access_token,
                        refresh_token: body.refresh_token,
                        user_id: body.user_id,
                    })

                    resolve(msalToken)

                }).catch((error) => {
                    reject(error)
                })

            }).catch((error) => {
                reject(error)
            })
        })
    }

    doXstsAuthorization(userToken:string, relyingParty:string){
        // Possible relyingParty values:
        // - http://xboxlive.com
        // - http://mp.xboxlive.com/
        // - http://gssv.xboxlive.com/
        // - rp://gswp.xboxlive.com/
        return new Promise<XstsToken>((resolve, reject) => {
            const payload = {
                Properties: {
                    SandboxId: 'RETAIL',
                    UserTokens: [userToken]
                },
                RelyingParty: relyingParty,
                TokenType: 'JWT'
            }
        
            const body = JSON.stringify(payload)
            const headers = {
                'x-xbl-contract-version': '1',
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'Origin': 'https://www.xbox.com',
                'Referer': 'https://www.xbox.com/',
                'Content-Length': body.length,
                'Accept': '*/*',
                'ms-cv': '0',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        
            this._httpClient.postRequest('xsts.auth.xboxlive.com', '/xsts/authorize', headers, body).then((response) => {
                resolve(new XstsToken(response.body()))

            }).catch((error) => {
                reject(error)
            })
        })
    }

    refreshUserToken(){
        return new Promise<UserToken>((resolve, reject) => {
            const refreshToken = this._tokenStore.getUserToken()?.data.refresh_token

            if(refreshToken === undefined){
                reject('No refresh token found. Please authenticate first.')
                return
            }

            const payload = {
                'client_id': this._clientId,
                'grant_type': 'refresh_token',
                'refresh_token': refreshToken,
                'scope': 'xboxlive.signin openid profile offline_access'
            }
            
            const body = new URLSearchParams(payload).toString()
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
            }
        
            this._httpClient.postRequest('login.microsoftonline.com', '/consumers/oauth2/v2.0/token', headers, body).then((response) => {

                const userTokenBody = response.body()
                const userToken = new UserToken(userTokenBody)

                this._tokenStore.setUserToken(userToken)
                this._tokenStore.save()

                resolve(userToken)

            }).catch((error) => {
                // @TODO: Implement TokenRefreshError to let the user know to login again.

                if(error.statuscode !== undefined && error.statuscode === 400){
                    // We have received a 400 status error. This means the refresh token is invalid.
                    reject(new TokenRefreshError('Failed to refresh tokens', error))
                } else {
                    reject(error)
                }
                
            })
        })
    }

    async getOrRefreshUserToken(){
        const userToken = this._tokenStore.getUserToken()

        if(userToken === undefined || userToken.getSecondsValid() <= 60){
            return (await this.refreshUserToken()).data.access_token
        }

        return userToken.data.access_token
    }

    doXstsAuthentication(){
        return new Promise<XstsToken>((resolve, reject) => {
            this.getOrRefreshUserToken().then((userToken) => {
                if(userToken === undefined){
                    reject('No user token found. Please authenticate first.')
                    return
                }

                const payload = {
                    Properties: {
                        AuthMethod: 'RPS',
                        RpsTicket: 'd='+userToken,
                        SiteName: 'user.auth.xboxlive.com'
                    },
                    RelyingParty: 'http://auth.xboxlive.com',
                    TokenType: 'JWT'
                }
            
                const body = JSON.stringify(payload)
                const headers = {
                    'x-xbl-contract-version': '1',
                    'Cache-Control': 'no-cache',
                    'Content-Type': 'application/json',
                    'Origin': 'https://www.xbox.com',
                    'Referer': 'https://www.xbox.com/',
                }
            
                this._httpClient.postRequest('user.auth.xboxlive.com', '/user/authenticate', headers, body).then((response) => {
                    this._xstsToken = new XstsToken(response.body())
                    resolve(this._xstsToken)

                }).catch((error) => {
                    reject(error)
                })

            }).catch((error) => {
                reject(error)
            })
        })
    }

    async getWebToken(){
        if(this._xstsToken === undefined || this._xstsToken.getSecondsValid() <= 60)
            await this.doXstsAuthentication()

        const userToken = this._xstsToken?.data.Token

        if(userToken === undefined){
            throw new Error('No user token found. Please authenticate first.')
        }

        const token = await this.doXstsAuthorization(userToken, 'http://xboxlive.com')
        return token
    }

    async getGssvToken(){
        if(this._xstsToken === undefined || this._xstsToken.getSecondsValid() <= 60)
            await this.doXstsAuthentication()

        const userToken = this._xstsToken?.data.Token

        if(userToken === undefined){
            throw new Error('No user token found. Please authenticate first.')
        }

        if(this._gssvToken === undefined || this._gssvToken.getSecondsValid() <= 60){

            const token = await this.doXstsAuthorization(userToken, 'http://gssv.xboxlive.com/')
            this._gssvToken = token
        }

        return this._gssvToken
    }

    async getStreamingTokens(){

        const gssvToken = await this.getGssvToken()

        if(gssvToken === undefined){
            throw new Error('No gssv token found. Please authenticate first.')
        }

        const _xhomeToken = await this.getStreamToken(gssvToken.data.Token, 'xhome')

        let _xcloudToken:StreamingToken | undefined = undefined
        try {
            _xcloudToken = await this.getStreamToken(gssvToken.data.Token, 'xgpuweb')
        } catch(error){
            try {
                _xcloudToken = await this.getStreamToken(gssvToken.data.Token, 'xgpuwebf2p')
            } catch(err) {
                console.log('Failed to get xcloud streaming token, probably a non-supported country. Error:', err)
            }
        }

        return { xHomeToken: _xhomeToken, xCloudToken: _xcloudToken }
    }

    getStreamToken(userToken:string, offering:string){
        return new Promise<StreamingToken>((resolve, reject) => {
            const payload = {
                'token': userToken,
                'offeringId': offering,
            }
            
            const body = JSON.stringify(payload)
            const headers = {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
                'x-gssv-client': 'XboxComBrowser',
                'Content-Length': body.length,
            }
        
            this._httpClient.postRequest(offering+'.gssv-play-prod.xboxlive.com', '/v2/login/user', headers, body).then((response) => {
                resolve(new StreamingToken(response.body()))

            }).catch((error) => {
                reject(error)
            })
        })
    }
}
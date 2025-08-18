import Http from './lib/http'
import crypto, { subtle, KeyObject } from 'crypto'
import { exportJWK } from 'jose'
import { dialog } from "electron";

import DeviceToken from './lib/tokens/devicetoken'
import SisuToken, { ISisuToken } from './lib/tokens/sisutoken'
import UserToken, { IUserToken } from './lib/tokens/usertoken'
import StreamingToken from './lib/tokens/streamingtoken'
import XstsToken from './lib/tokens/xststoken'
import MsalToken from './lib/tokens/msaltoken'

import TokenStore from './tokenstore'

const UUID = require('uuid-1345')
const nextUUID = () => UUID.v3({ namespace: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: Date.now().toString() })

interface ICodeChallange {
    value: string
    method: string
    verifier: string
}

interface ISisuAuthenticationResponse {
    MsaOauthRedirect: string
    MsaRequestParameters: {}
    SessionId: string
}

export default class Xal {

    keys
    jwtKeys

    deviceTokenRetryCount
    tokenStore

    _app = {
        AppId: '000000004c20a908', //'000000004c12ae6f', // 0000000048183522 = working, but minecraft --<<< 000000004c12ae6f works, xbox app
        TitleId: '328178078', //'328178078', // 1016898439 = working
        RedirectUri: 'ms-xal-000000004c20a908://auth'
    }

    constructor(tokenStore?:TokenStore){
        if(tokenStore && tokenStore._jwtKeys){
            this.setKeys(tokenStore._jwtKeys.jwt).then((keys) => {
                console.log('Keys loaded:', keys)
            }).catch((error) => {
                console.log('Failed to load keys:', error)
            })

            this.tokenStore = tokenStore
        }
        this.deviceTokenRetryCount = 0
    }

    setKeys(orgJwtKey){
        return new Promise((resolve, reject) => {
            subtle.importKey('jwk', orgJwtKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']).then(jwtKey => {
                const privateKey = KeyObject.from(jwtKey);

                this.jwtKeys = {
                    raw: {
                        privateKey: privateKey
                    },
                    jwt: orgJwtKey
                }

                resolve(this.jwtKeys)

            }).catch((error) => {
                console.log('key error:', error)
                reject(error)
            })
        });
    }

    getKeys(){
        return new Promise((resolve, reject) => {
            if(this.jwtKeys !== undefined){
                resolve(this.jwtKeys)

            } else if(this.keys === undefined){
                this.keys = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })

                this.jwtKeys = {
                    raw: this.keys
                }

                exportJWK(this.keys.publicKey).then(jwk => {
                    const jwkKey = { ...jwk, alg: 'ES256', use: 'sig' }
                    this.jwtKeys = {
                        raw: this.keys,
                        jwt: jwkKey
                    }

                    const jwkKeys = this.jwtKeys.raw.privateKey.export({ type: 'pkcs8', format: 'jwk' })
                    this.setKeys(jwkKeys).then(keys => {
                        resolve(keys)
                    }).catch((error) => {
                        reject(error)
                    })
                })

            } else {
                resolve(this.jwtKeys)
            }
        })
    }

    codeChallange

    getCodeChallange() {
        return new Promise<ICodeChallange>((resolve, reject) => {
            if(this.codeChallange === undefined){
                const code_verifier = Buffer.from(crypto.pseudoRandomBytes(32)).toString('base64url')

                const code_challenge = crypto
                    .createHash("sha256")
                    .update(code_verifier)
                    .digest();

                this.codeChallange = {
                    value: code_challenge.toString('base64url'),
                    method: 'S256',
                    verifier: code_verifier,
                }
            }

            resolve(this.codeChallange)
        })
    }

    getRandomState(bytes = 64) {
        return crypto.randomBytes(bytes).toString('base64url')
    }

    getDeviceTokenHack() {
        console.log('getDeviceTokenHack...')
        return new Promise<DeviceToken>((resolve, reject) => {
            this.getDeviceToken().then(deviceToken => {
                console.log('getDeviceToken success:', deviceToken)
                resolve(deviceToken)
            })
            .catch(error => {
                if (error.statuscode == 400) {
                    if (this.deviceTokenRetryCount < 20) {
                        console.log('device token get error, retry...')
                        this.deviceTokenRetryCount += 1
                        return this.getDeviceTokenHack().then(resolve).catch(reject)
                    } else {
                        // Clear data 
                        dialog.showMessageBox({
                            message:
                                "Error: Failed to refresh device token:" +
                                JSON.stringify(error) + 
                                ", Please login again.",
                            type: "error",
                        });
                        this.tokenStore.clear && this.tokenStore.clear();
                        reject(error)
                    }
                    
                } else {
                    reject(error)
                }
            })
        })
    }

    getDeviceToken() {
        console.log('getDeviceToken...')
        return new Promise<DeviceToken>((resolve, reject) => {
            this.getKeys().then((jwtKeys:any) => {
                const payload = {
                    Properties: {
                        AuthMethod: 'ProofOfPossession',
                        Id: `{${nextUUID()}}`,
                        DeviceType: 'Android',
                        SerialNumber: `{${nextUUID()}}`,
                        Version: '15.0',
                        ProofKey: {
                            'use': 'sig',
                            'alg': 'ES256',
                            'kty': 'EC',
                            'crv': 'P-256',
                            'x': jwtKeys.jwt.x,
                            'y': jwtKeys.jwt.y
                        }
                    },
                    RelyingParty: 'http://auth.xboxlive.com',
                    TokenType: 'JWT'
                }
            
                const body = JSON.stringify(payload)
                const signature = this.sign('https://device.auth.xboxlive.com/device/authenticate', '', body, jwtKeys).toString('base64')
                const headers = { ...{
                    'x-xbl-contract-version': '1',
                    'Cache-Control': 'no-store, must-revalidate, no-cache'
                }, Signature: signature }
            
                const HttpClient = new Http()
                HttpClient.postRequest('device.auth.xboxlive.com', '/device/authenticate', headers, body).then((response) => {
                    resolve(new DeviceToken(response.body()))
                }).catch((error) => {
                    // Refresh jwtKeys
                    this.jwtKeys = null;
                    reject(error)
                })
            })
        })
    }

    doSisuAuthentication(deviceToken:DeviceToken, codeChallange:ICodeChallange, state){
        return new Promise<ISisuAuthenticationResponse>((resolve, reject) => {
            this.getKeys().then((jwtKeys:any) => {

                const payload = {
                    AppId: this._app.AppId,
                    TitleId: this._app.TitleId,
                    RedirectUri: this._app.RedirectUri,
                    DeviceToken: deviceToken.data.Token,
                    Sandbox: "RETAIL",
                    TokenType: "code",
                    Offers: ["service::user.auth.xboxlive.com::MBI_SSL"],
                    Query: {
                        display: 'android_phone',
                        code_challenge: codeChallange.value,
                        code_challenge_method: codeChallange.method,
                        state: state,
                    },
                }
            
                const body = JSON.stringify(payload)
                const signature = this.sign('https://sisu.xboxlive.com/authenticate', '', body, jwtKeys).toString('base64')
                const headers = { ...{
                    'x-xbl-contract-version': '1',
                    'Cache-Control': 'no-store, must-revalidate, no-cache',
                }, Signature: signature }
            
                const HttpClient = new Http()
                HttpClient.postRequest('sisu.xboxlive.com', '/authenticate', headers, body).then((response) => {
                    // Add SessionId to response object
                    const resBody = { SessionId: response.headers['x-sessionid'], ...response.body() }
                    resolve(( resBody as ISisuAuthenticationResponse))

                }).catch((error) => {
                    reject(error)
                })
            })
        })
    }

    doSisuAuthorization(userToken:UserToken, deviceToken:DeviceToken, SessionId?:string){
        console.log('doSisuAuthorization...')
        return new Promise<SisuToken>((resolve, reject) => {
            this.getKeys().then((jwtKeys:any) => {

                const payload = {
                    AccessToken: 't='+userToken.data.access_token,
                    AppId: this._app.AppId,
                    DeviceToken: deviceToken.data.Token,
                    Sandbox: "RETAIL",
                    SiteName: "user.auth.xboxlive.com",
                    UseModernGamertag: true,
                    ProofKey: {
                        'use': 'sig',
                        'alg': 'ES256',
                        'kty': 'EC',
                        'crv': 'P-256',
                        'x': jwtKeys.jwt.x,
                        'y': jwtKeys.jwt.y
                    },
                    ...SessionId ? { SessionId: SessionId } : {}
                }
                
                const body = JSON.stringify(payload)
                const signature = this.sign('https://sisu.xboxlive.com/authorize', '', body, jwtKeys).toString('base64')
                const headers = {
                    'x-xbl-contract-version': '1',
                    'Cache-Control': 'no-store, must-revalidate, no-cache',
                    signature: signature
                }
            
                const HttpClient = new Http()
                HttpClient.postRequest('sisu.xboxlive.com', '/authorize', headers, body).then((response) => {
                    resolve(new SisuToken(response.body()))

                }).catch((error) => {
                    reject(error)
                })
            })
        })
    }

    exchangeCodeForToken(code:string, codeVerifier:string){
        return new Promise<UserToken>((resolve, reject) => {
            const payload = {
                'client_id': this._app.AppId,
                'code': code,
                'code_verifier': codeVerifier,
                'grant_type': 'authorization_code',
                'redirect_uri': this._app.RedirectUri,
                'scope': 'service::user.auth.xboxlive.com::MBI_SSL'
            }
            
            const body = new URLSearchParams(payload).toString()
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
            }
        
            const HttpClient = new Http()
            HttpClient.postRequest('login.live.com', '/oauth20_token.srf', headers, body).then((response) => {
                resolve(new UserToken(response.body()))

            }).catch((error) => {
                reject(error)
            })
        })
    }

    refreshUserToken(userToken:UserToken){
        console.log('refreshUserToken...')
        return new Promise<UserToken>((resolve, reject) => {
            const payload = {
                'client_id': this._app.AppId,
                'grant_type': 'refresh_token',
                'refresh_token': userToken.data.refresh_token,
                'scope': 'service::user.auth.xboxlive.com::MBI_SSL'
            }
            
            const body = new URLSearchParams(payload).toString()
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
            }
        
            const HttpClient = new Http()
            HttpClient.postRequest('login.live.com', '/oauth20_token.srf', headers, body).then((response) => {
                console.log('refreshUserToken success: ', response.body())
                resolve(new UserToken(response.body()))
            }).catch((error) => {
                console.log('refreshUserToken fail:', error)
                reject(error)
            })
        })
    }

    doXstsAuthorization(sisuToken:SisuToken, relyingParty:string){
        return new Promise<XstsToken>((resolve, reject) => {
            this.getKeys().then((jwtKeys:any) => {

                const payload = {
                    Properties: {
                        SandboxId: 'RETAIL',
                        DeviceToken: sisuToken.data.DeviceToken,
                        TitleToken: sisuToken.data.TitleToken.Token,
                        UserTokens: [sisuToken.data.UserToken.Token]
                    },
                    RelyingParty: relyingParty,
                    TokenType: 'JWT'
                }
            
                const body = JSON.stringify(payload)
                const signature = this.sign('https://xsts.auth.xboxlive.com/xsts/authorize', '', body, jwtKeys).toString('base64')
                const headers = { ...{
                    'x-xbl-contract-version': '1',
                    'Cache-Control': 'no-store, must-revalidate, no-cache',
                }, Signature: signature }
            
                const HttpClient = new Http()
                HttpClient.postRequest('xsts.auth.xboxlive.com', '/xsts/authorize', headers, body).then((response) => {
                    resolve(new XstsToken(response.body()))

                }).catch((error) => {
                    reject(error)
                })
            })
        })
    }

    exchangeRefreshTokenForXcloudTransferToken(userToken:UserToken){
        return new Promise<MsalToken>((resolve, reject) => {
            const payload = {
                client_id: this._app.AppId,
                grant_type: 'refresh_token',
                scope: 'service::http://Passport.NET/purpose::PURPOSE_XBOX_CLOUD_CONSOLE_TRANSFER_TOKEN',
                refresh_token: userToken.data.refresh_token,
                code: '',
                code_verifier: '',
                redirect_uri: '',
            }
            
            const body = new URLSearchParams(payload).toString()
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
            }
        
            const HttpClient = new Http()
            HttpClient.postRequest('login.live.com', '/oauth20_token.srf', headers, body).then((response) => {
                resolve(new MsalToken(response.body()))

            }).catch((error) => {
                reject(error)
            })
        })
    }

    getStreamToken(xstsToken:XstsToken, offering:string, forceRegionIp: string = ''){
        return new Promise<StreamingToken>((resolve, reject) => {
            const payload = {
                'token': xstsToken.data.Token,
                'offeringId': offering,
            }
            
            const body = JSON.stringify(payload)
            const headers = {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, must-revalidate, no-cache',
                'x-gssv-client': 'XboxComBrowser',
                'Content-Length': body.length,
            }

            if (forceRegionIp.length > 0) {
                headers['x-forwarded-for'] = forceRegionIp
            }
        
            const HttpClient = new Http()
            HttpClient.postRequest(offering+'.gssv-play-prod.xboxlive.com', '/v2/login/user', headers, body).then((response) => {
                resolve(new StreamingToken(response.body()))

            }).catch((error) => {
                reject(error)
            })
        })
    }

    // Credits to https://github.com/PrismarineJS/prismarine-auth for the signing part
    sign(url, authorizationToken, payload, jwtKeys) {
        const windowsTimestamp = (BigInt((Date.now() / 1000) | 0) + BigInt(11644473600)) * BigInt(10000000)
        const pathAndQuery = new URL(url).pathname
    
        const allocSize = 5 + 9 + 5 + pathAndQuery.length + 1 + authorizationToken.length + 1 + payload.length + 1
        const buf = Buffer.alloc(allocSize)
        buf.writeInt32BE(1)
        buf.writeUInt8(0, 4)
        buf.writeBigUInt64BE(windowsTimestamp, 5)
        buf.writeUInt8(0, 13)
        let offset = 14

        Buffer.from('POST').copy(buf, offset)
        buf.writeUInt8(0, offset+4)
        offset = offset+4+1

        Buffer.from(pathAndQuery).copy(buf, offset)
        buf.writeUInt8(0, offset+pathAndQuery.length)
        offset = offset+pathAndQuery.length+1

        Buffer.from(authorizationToken).copy(buf, offset)
        buf.writeUInt8(0, offset+authorizationToken.length)
        offset = offset+authorizationToken.length+1

        Buffer.from(payload).copy(buf, offset)
        buf.writeUInt8(0, offset+payload.length)
        offset = offset+payload.length+1

        const signature = crypto.sign('SHA256', buf, { key: jwtKeys.raw.privateKey, dsaEncoding: 'ieee-p1363' })
    
        const header = Buffer.alloc(signature.length + 12)
        header.writeInt32BE(1)
        header.writeBigUInt64BE(windowsTimestamp, 4)
        Buffer.from(signature).copy(header, 12)
    
        return header
    }

    // Token retrieval helpers
    async refreshTokens(tokenStore:TokenStore){
        const curUserToken = tokenStore.getUserToken()
        if(curUserToken === undefined)
            throw new Error('User token is missing. Please authenticate first')

        try {
            const userToken = await this.refreshUserToken(curUserToken)
            const deviceToken = await this.getDeviceTokenHack()
            const sisuToken = await this.doSisuAuthorization(userToken, deviceToken)

            tokenStore.setUserToken(userToken)
            tokenStore.setSisuToken(sisuToken)
            tokenStore.save()

            return { userToken, deviceToken, sisuToken }
        } catch (error) {
            throw new TokenRefreshError('Failed to refresh tokens: ' + JSON.stringify(error))
        }
    }

    async getMsalToken(tokenStore:TokenStore){
        const userToken = tokenStore.getUserToken()
        if(userToken === undefined)
            throw new Error('User token is missing. Please authenticate first')
        
        return await this.exchangeRefreshTokenForXcloudTransferToken(userToken)    
    }

    _webToken:XstsToken | undefined

    async getWebToken(tokenStore:TokenStore){
        const sisuToken = tokenStore.getSisuToken()
        if(sisuToken === undefined)
            throw new Error('Sisu token is missing. Please authenticate first')

        if(this._webToken === undefined || this._webToken.getSecondsValid() <= 60){
            const token = await this.doXstsAuthorization(sisuToken, 'http://xboxlive.com')
            this._webToken = token

            return token
        } else {
            return this._webToken as XstsToken
        }
    }

    _xhomeToken:StreamingToken | undefined
    _xcloudToken:StreamingToken | undefined

    async getStreamingToken(tokenStore:TokenStore){
        const sisuToken = tokenStore.getSisuToken()
        if(sisuToken === undefined)
            throw new Error('Sisu token is missing. Please authenticate first')

        const xstsToken = await this.doXstsAuthorization(sisuToken, 'http://gssv.xboxlive.com/')

        if(this._xhomeToken === undefined || this._xhomeToken.getSecondsValid() <= 60){
            this._xhomeToken = await this.getStreamToken(xstsToken, 'xhome')
        }

        if(this._xcloudToken === undefined || this._xcloudToken.getSecondsValid() <= 60){
            try {
                this._xcloudToken = await this.getStreamToken(xstsToken, 'xgpuweb')
            } catch(error) {
                console.error('[getStreamingToken] xgpuweb error:', error);
                try {
                    this._xcloudToken = await this.getStreamToken(xstsToken, 'xgpuwebf2p')
                } catch (e) {
                    console.error('[getStreamingToken] xgpuwebf2p error:', e);
                }
            }
        }

        return { xHomeToken: this._xhomeToken, xCloudToken: this._xcloudToken }
    }

    async getRedirectUri(){
        const deviceToken = await this.getDeviceTokenHack()
        const codeChallange = await this.getCodeChallange()
        const state = this.getRandomState()
        const sisuAuth = await this.doSisuAuthentication(deviceToken, codeChallange, state)

        return {
            sisuAuth,
            state,
            codeChallange
        }
    }



    async authenticateUser(tokenStore:TokenStore, redirectObject:{
        sisuAuth: ISisuAuthenticationResponse;
        state: string;
        codeChallange: ICodeChallange;
    }, redirectUri:string){
        const url = new URL(redirectUri)

        const error = url.searchParams.get('error')
        if(error){
            const error_description = url.searchParams.get('error_description')
            return false
        }

        const code = url.searchParams.get('code')
        if(code){
            const state = url.searchParams.get('state')
            if(state) {
                return this.authenticateUserUsingCode(tokenStore, redirectObject, code, state)
            }
        }

        return false
    }

    async authenticateUserUsingCode(tokenStore:TokenStore, redirectObject:{
        sisuAuth: ISisuAuthenticationResponse;
        state: string;
        codeChallange: ICodeChallange;
    }, code:string, state:string){

        console.log('authenticateUser:', code, state)

        if(state !== redirectObject.state){
            // console.log('Authentication failed: State mismatch')
            return false
        }
        const codeChallange = await this.getCodeChallange()
        const userToken = await this.exchangeCodeForToken(code, codeChallange.verifier)

        tokenStore.setUserToken(userToken)
        tokenStore.setJwtKeys(this.jwtKeys)
        tokenStore.save()

        return true
    }
}

export class TokenRefreshError extends Error {}
import Application from '../application'
import HTTP from './http'
import Store from 'electron-store'
import axios from 'axios'
import { defaultSettings } from "../../renderer/context/userContext.defaults";

interface titleInfoArgs {
    ProductTitle: string;
    PublisherName: string;
    XCloudTitleId: string;
    Image_Tile: any;
    Image_Poster: any;
    Streamability: any;
    Categories: any;
    LocalizedCategories: any;
    XCloudOfferings: any;
    XboxTitleId: string;
    ChildXboxTitleIds: any;
    StoreId: string;
}

export default class TitleManager {

    _application:Application
    _store = new Store()
    _http:HTTP

    _xCloudTitles = {}
    _productIdQueue = []

    _xCloudRecentTitles = {}
    _xCloudRecentTitlesLastUpdate = 0

    
    constructor(application){
        this._application = application
        this._http = new HTTP(this._application)
    }
    // getOfficialTitles() {
    //     return new Promise(resolve => {
    //         let officialTitles = [];
    //         axios
    //         .get('https://api.github.com/repos/Geocld/XStreaming/contents/titles.json?ref=main', {
    //             timeout: 20 * 1000,
    //         })
    //         .then(res => {
    //             if (res.status === 200) {
    //                 const content = res.data.content;
    //                 const base64ContentCleaned = content.replace(/\n/g, '');

    //                 const decodedBuffer = Buffer.from(base64ContentCleaned, 'base64');
    //                 const decodedContent = decodedBuffer.toString('utf-8');

    //                 const decodedJson = JSON.parse(decodedContent);

    //                 officialTitles = decodedJson.Products;
    //             }
    //             resolve(officialTitles);
    //         })
    //         .catch(e => {
    //             console.log('officialTitles error:', e)
    //             resolve([]);
    //         });
    //     });
    // }

    getOfficialTitles() {
        return new Promise(resolve => {
            let officialTitles = [];
            axios
            .get('https://cdn.jsdelivr.net/gh/Geocld/XStreaming@main/titles.json', {
                timeout: 10 * 1000,
            })
            .then(res => {
                if (res.status === 200) {
                    officialTitles = res.data.Products;
                }
                resolve(officialTitles);
            })
            .catch(e => {
                resolve([]);
            });
        });
    }

    getGamePassProducts(titles) {
        return new Promise((resolve, reject) => {
            const productIdQueue = [];
            const v2TitleMap = {};
            if (!Array.isArray(titles)) {
                resolve([]);
            }
            titles.forEach(title => {
                if (title.details && title.details.productId) {
                    productIdQueue.push(title.details.productId);
                    v2TitleMap[title.details.productId] = title;
                }
            });

            const settings: any = this._application._store.get(
                "settings",
                defaultSettings
            );
            const lang = settings.preferred_game_language.indexOf('zh') > -1 ? 'zh-TW' : 'en-US';

            // Get officialTitles
            this.getOfficialTitles().then((officialTitles: any) => {
                const mergeProductIds = [
                    ...new Set([...productIdQueue, ...officialTitles]),
                ];
    
                this._http.post('catalog.gamepass.com', `/v3/products?market=US&language=${lang}&hydration=RemoteLowJade0`, { // RemoteLowJade0
                    'Products': mergeProductIds,
                }, {
                    'ms-cv': 0,
                    'calling-app-name': 'Xbox Cloud Gaming Web',
                    'calling-app-version': '24.17.63',
    
                }).then((result: any) => {
                    if (result && result.Products) {
                        const products = result.Products;
                        let mergedTitles = [];
                        for (const key in products) {
                            if (v2TitleMap[key]) {
                            mergedTitles.push({
                                productId: key,
                                ...products[key],
                                ...v2TitleMap[key],
                            });
                            } else {
                            mergedTitles.push({
                                productId: key,
                                ...products[key],
                            });
                            }
                        }
                        mergedTitles.sort((a, b) =>
                            a.ProductTitle.localeCompare(b.ProductTitle),
                        );
                        mergedTitles = mergedTitles.filter(item => {
                            return item.titleId || item.XCloudTitleId;
                        });
                        resolve(mergedTitles);
                    } else {
                        resolve([]);
                    }
                }).catch(e => {
                    console.log('getGamePassProducts error:', e);
                    reject(e);
                });
            });
        })
    }

    getNewTitles(){
        return this._http.get('catalog.gamepass.com', '/sigls/v2?id=f13cf6b4-57e6-4459-89df-6aec18cf0538&market=US&language=en-US')
    }
}

interface TitleDetails {
    titleId:string;
    details: {
        productId:string;
        xboxTitleId:number;
        hasEntitlement:boolean;
        supportsInAppPurchases:boolean;
        supportedTabs: any;
        supportedInputTypes: any;
        programs: any;
        userPrograms: any;
        userSubscriptions: any;
        isFreeInStore: boolean;
        maxGameplayTimeInSeconds: number;
    };
}

export class Title {

    titleId
    productId
    xboxTitleId
    supportedInputTypes
    catalogDetails

    constructor(title:TitleDetails){
        this.titleId = title.titleId
        this.productId = title.details.productId
        this.xboxTitleId = title.details.xboxTitleId
        this.supportedInputTypes = title.details.supportedInputTypes
    }

    setCatalogDetails(titleInfo:titleInfoArgs){
        this.catalogDetails = titleInfo
    }

    toString(){
        return JSON.stringify(this)
    }

    restoreFromCache(cachedObj){
        this.catalogDetails = cachedObj.catalogDetails
    }
}
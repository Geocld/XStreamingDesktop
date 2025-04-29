import { Preload } from '../main/preload'

/* eslint-disable */
declare global {
    interface Window {
        XStreaming: typeof Preload;
        _xboxTitleId: any;
    }
}
/* eslint-enable */
import { Logger } from '@promisepending/logger.js';

export interface IWebsocketOptions {
    host: string
    port: number
    id: string
    secureMode?: boolean
    secureKey?: string
    shardMode?: boolean
    logger?: Logger
}

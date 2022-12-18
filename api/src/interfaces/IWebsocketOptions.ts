import { Logger } from '../logger';

export interface IWebsocketOptions {
    host: string
    port: number
    id: string
    secureMode?: boolean
    secureKey?: string
    shardMode?: boolean
    logger?: Logger
}

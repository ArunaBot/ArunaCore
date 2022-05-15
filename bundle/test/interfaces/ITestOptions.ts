import { Logger, WebSocketClient } from 'arunacore-api';
import { Socket } from '@arunabot/core-websocket';

export interface ITestOptions {
    loggerClient: Logger,
    loggerServer: Logger,
    client: WebSocketClient,
    server: Socket,
    index: number,
}

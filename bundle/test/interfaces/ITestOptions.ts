import { Logger } from '@promisepending/logger.js';
import { Socket } from '@arunabot/core-websocket';
import { ArunaClient } from 'arunacore-api';

export interface ITestOptions {
    loggerClient: Logger,
    loggerServer: Logger,
    client: ArunaClient,
    client2: ArunaClient,
    client3: ArunaClient,
    server: Socket,
    index: number,
}

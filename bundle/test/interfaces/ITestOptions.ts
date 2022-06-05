import { Logger, ArunaClient } from 'arunacore-api';
import { Socket } from '@arunabot/core-websocket';

export interface ITestOptions {
    loggerClient: Logger,
    loggerServer: Logger,
    client: ArunaClient,
    server: Socket,
    index: number,
}

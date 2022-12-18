import { Logger, ArunaClient } from 'arunacore-api';
import { Socket } from '@arunabot/core-websocket';

export interface ITestOptions {
    loggerClient: Logger,
    loggerServer: Logger,
    client: ArunaClient,
    client2: ArunaClient,
    client3: ArunaClient,
    server: Socket,
    index: number,
}

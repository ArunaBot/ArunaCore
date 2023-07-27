import { Logger } from '@promisepending/logger.js';
import { ArunaClient } from 'arunacore-api';
import { Socket } from '../../main';

export interface ITestOptions {
    loggerClient: Logger,
    loggerServer: Logger,
    client: ArunaClient,
    client2: ArunaClient,
    client3: ArunaClient,
    server: Socket,
    index: number,
}

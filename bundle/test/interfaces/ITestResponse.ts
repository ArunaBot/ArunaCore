import { ArunaClient } from 'arunacore-api';
import { Socket } from '@arunabot/core-websocket';

export interface ITestResponse {
    server?: Socket,
    client?: ArunaClient,
    testID?: number
}

import { WebSocketClient } from 'arunacore-api';
import { Socket } from '@arunabot/core-websocket';

export interface ITestResponse {
    server?: Socket,
    client?: WebSocketClient,
    testID?: number
}

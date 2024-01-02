import { ArunaClient } from 'arunacore-api';
import { Socket } from '../../main';

export interface ITestResponse {
    server?: Socket,
    client?: ArunaClient,
    client2?: ArunaClient,
    client3?: ArunaClient,
    testID?: number
}

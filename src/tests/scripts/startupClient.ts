import { ITestResponse, ITestOptions } from '../interfaces';
import { IMessage, ArunaClient } from '../../../api/src';

function runStartupClient1({ loggerClient, index }: ITestOptions): Promise<ITestResponse> {
  return new Promise((resolve, reject) => {
    const client = new ArunaClient({ host: 'localhost', port: 3000, id: 'client', logger: loggerClient });

    client.connect();

    client.on('message', (message: IMessage) => {
      loggerClient.info('[1]: ', message);
    });

    client.on('ready', () => {
      loggerClient.info('Client is Ready');
      return resolve({ client, testID: index });
    });

    client.on('close', (code, reason) => {
      if (code === 1000) return;
      if (code === 1012) {
        loggerClient.debug('Server Shutdown, Client Stopped');
        return;
      }
      loggerClient.error('Client Closed with code: ' + code + ' and reason: ' + reason);
      return reject(new Error('Client Closed with code: ' + code + ' and reason: ' + reason));
    });

    client.on('error', (err) => {
      loggerClient.error('Client Error: ' + err);
      return reject(err);
    });
  });
}

export const name = 'Startup Client 1';
export const run = runStartupClient1;
export const order = 1;

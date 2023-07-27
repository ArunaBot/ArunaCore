import { ITestResponse, ITestOptions } from '../interfaces';
import { IMessage, ArunaClient } from '../../../api/src';

function runStartupClient2({ loggerClient, index }: ITestOptions): Promise<ITestResponse> {
  return new Promise((resolve, reject) => {
    const client = new ArunaClient({ host: 'localhost', port: 3000, id: 'client2', logger: loggerClient, secureMode: true, secureKey: 'test2' });

    client.connect();

    client.on('message', (message: IMessage) => {
      loggerClient.info('2' + client.getWSParser().toString(message));
    });

    client.on('ready', () => {
      loggerClient.info('Client 2 is Ready');
      return resolve({ client2: client, testID: index });
    });

    client.on('close', (code, reason) => {
      if (code === 1000) return;
      if (code === 1012) {
        loggerClient.debug('Server Shutdown, Client 2 Stopped');
        return;
      }
      loggerClient.error('Client 2 Closed with code: ' + code + ' and reason: ' + reason);
      return reject(new Error('Client 2 Closed with code: ' + code + ' and reason: ' + reason));
    });

    client.on('error', (err) => {
      loggerClient.error('Client 2 Error: ' + err);
      return reject(err);
    });
  });
}

export const name = 'Startup Client 2';
export const run = runStartupClient2;
export const order = 2;

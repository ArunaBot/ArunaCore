import { ITestResponse, ITestOptions } from '../interfaces';
import { IMessage, ArunaClient } from 'arunacore-api';

function runStartupClient3({ loggerClient, index }: ITestOptions): Promise<ITestResponse> {
  return new Promise((resolve, reject) => {
    const client = new ArunaClient({ host: 'localhost', port: 3000, id: 'client3', logger: loggerClient });

    client.connect('test3');

    client.on('message', (message: IMessage) => {
      loggerClient.info('3' + client.getWSParser().toString(message));
    });

    client.on('ready', () => {
      loggerClient.info('Client 3 is Ready');
      return resolve({ client3: client, testID: index });
    });

    client.on('close', (code, reason) => {
      if (code === 1000) return;
      if (code === 1012) {
        loggerClient.debug('Server Shutdown, Client 3 Stopped');
        return;
      }
      loggerClient.error('Client 3 Closed with code: ' + code + ' and reason: ' + reason);
      return reject(new Error('Client 3 Closed with code: ' + code + ' and reason: ' + reason));
    });

    client.on('error', (err) => {
      loggerClient.error('Client 3 Error: ' + err);
      return reject(err);
    });
  });
}

module.exports = {
  name: 'Startup Client 3',
  run: runStartupClient3,
  order: 3,
};

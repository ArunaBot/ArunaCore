import { ITestOptions } from '../interfaces';

async function sendMessage3Test({ loggerClient, client, client2 }: ITestOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await client.send('999', ['test3'], 'client2');
    const timeout = setTimeout(() => {
      loggerClient.error('Message 3 Timeout');
      return reject(new Error('Message 3 Timeout'));
    }, 10000);
    client2.once('999', (message) => {
      loggerClient.info('Message 3 Received: ', message);
      clearTimeout(timeout);
      return reject(new Error('Message 3 Received'));
    });
    client.once('unauthorized', () => {
      loggerClient.info('Client 1 Unauthorized as intended');
      clearTimeout(timeout);
      return resolve();
    });
  });
}

export const name = 'Send Message 3 Test';
export const run = sendMessage3Test;
export const order = 7;

import { ITestOptions } from '../interfaces';

async function sendMessage2Test({ loggerClient, client, client3 }: ITestOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await client3.send('999', ['test2'], 'client');
    const timeout = setTimeout(() => {
      loggerClient.error('Message 2 Timeout');
      return reject(new Error('Message 2 Timeout'));
    }, 10000);
    client.once('999', (message) => {
      loggerClient.info('Message 2 Received: ', message);
      clearTimeout(timeout);
      return resolve();
    });
  });
}

export const name = 'Send Message 2 Test';
export const run = sendMessage2Test;
export const order = 6;

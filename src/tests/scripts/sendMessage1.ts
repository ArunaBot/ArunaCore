import { ITestOptions } from '../interfaces';

async function sendMessage1Test({ loggerClient, client2, client3 }: ITestOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      loggerClient.error('Message 1 Timeout');
      return reject(new Error('Message 1 Timeout'));
    }, 10000);
    client3.once('999', (message) => {
      loggerClient.info('Message 1 Received: ', message);
      clearTimeout(timeout);
      return resolve();
    });
    await client2.send('test', { command: '999', target: { id: 'client3', key: 'test3' } });
  });
}

export const name = 'Send Message 1 Test';
export const run = sendMessage1Test;
export const order = 5;

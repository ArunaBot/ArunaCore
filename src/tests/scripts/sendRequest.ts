import { IMessage } from 'arunacore-api';
import { ITestOptions } from '../interfaces';

async function sendRequestTest({ loggerClient, client2, client3 }: ITestOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      loggerClient.error('Request Timeout');
      return reject(new Error('Request Timeout'));
    }, 10000);

    client3.once('request', async (message: IMessage) => {
      loggerClient.info('Client 3 Received Request: ', message);
      try {
        await message.reply!('test', { toKey: 'test2' });
        loggerClient.info('Client 3 Replied to Request');
      } catch (e) {
        loggerClient.error('Client 3 Failed to Reply to Request: ' + e);
        return reject(e);
      }
    });

    const response = await client2.request('test', { target: { id: 'client3', key: 'test3' } });
    loggerClient.info('Request Response: ', response);
    clearTimeout(timeout);

    if (response.content === 'test') {
      return resolve();
    } else {
      return reject(new Error(`Invalid Response Content: ${response.content}`));
    }
  });
}

export const name = 'Request Test';
export const run = sendRequestTest;
export const order = 8;

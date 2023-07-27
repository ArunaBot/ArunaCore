import { ITestOptions } from '../interfaces';

async function pingTest({ loggerClient, client }: ITestOptions): Promise<void> {
  return new Promise(async (resolve, reject) => {
    loggerClient.info('Sending Ping...');
    await client.ping().catch((err) => {
      loggerClient.error('Ping Failed: ' + err);
      return reject(err);
    }).then(() => {
      loggerClient.info('Ping Sent');
      return resolve();
    });
  });
}

export const name = 'Ping Test';
export const run = pingTest;
export const order = 4;

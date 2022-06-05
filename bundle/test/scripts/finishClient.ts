import { ITestOptions } from '../interfaces';

async function finishClient({ loggerClient, client }: ITestOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    loggerClient.info('Shutting down client...');

    client.on('finish', () => {
      loggerClient.info('Client Finished');
      return resolve();
    });
    client.finish().catch((err) => {
      loggerClient.error('Client Failed on Finish: ' + err);
      return reject(err);
    });
  });
}

module.exports = {
  name: 'Finish Client',
  run: finishClient,
  order: 998,
};

import { ITestOptions } from '../interfaces';

async function finishClient({ loggerClient, client, client2, client3 }: ITestOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    loggerClient.info('Shutting down clients...');

    const client1Promise = new Promise((resolve, reject) => {
      client.on('finish', () => {
        loggerClient.info('Client Finished');
        return resolve(true);
      });
      client.finish().catch((err) => {
        loggerClient.error('Client Failed on Finish: ' + err);
        return reject(err);
      });
    });

    const client2Promise = new Promise((resolve, reject) => {
      client2.on('finish', () => {
        loggerClient.info('Client 2 Finished');
        return resolve(true);
      });
      client2.finish().catch((err) => {
        loggerClient.error('Client 2 Failed on Finish: ' + err);
        return reject(err);
      });
    });

    const client3Promise = new Promise((resolve, reject) => {
      client3.on('finish', () => {
        loggerClient.info('Client 3 Finished');
        return resolve(true);
      });
      client3.finish().catch((err) => {
        loggerClient.error('Client 3 Failed on Finish: ' + err);
        return reject(err);
      });
    });

    Promise.all([client1Promise, client2Promise, client3Promise]).then(() => {
      loggerClient.info('Clients Finished');
      return resolve();
    }).catch((err) => {
      loggerClient.error('Clients Failed on Finish: ' + err);
      return reject(err);
    });
  });
}

module.exports = {
  name: 'Finish Client',
  run: finishClient,
  order: 996,
};

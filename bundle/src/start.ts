import { Logger } from '@promisepending/logger.js';
import { Socket } from '@arunabot/core-websocket';

const logger = new Logger({ debug: true, prefix: 'arunacore' });

console.log('Initializing ArunaCore');
logger.info('Logger Initialized!');

const webs = new Socket(3000, logger, { autoLogEnd: true });

webs.on('message', (message) => {
  logger.info('Message received:', message);
});

if (process.env.FINISH_IN_SECONDS) {
  const seconds = parseInt(process.env.FINISH_IN_SECONDS);
  logger.warn(`Finishing in ${seconds} seconds...`);
  setTimeout(() => {
    webs.finishWebSocket();
  }, seconds * 1000);
}

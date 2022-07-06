import { Socket } from '@arunabot/core-websocket';
import { Logger } from 'arunacore-api';
const logger = new Logger({ debug: true, prefix: 'arunacore' });

console.log('Initializing ArunaCore');
logger.info('Logger Initialized!');

const webs = new Socket(3000, logger, { autoLogEnd: true });

webs.on('message', (message) => {
  logger.info('Message received:', message);
});

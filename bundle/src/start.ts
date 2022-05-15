import { Socket } from '@arunabot/core-websocket';
import { Logger } from 'arunacore-api';
const logger = new Logger({ debug: true, prefix: 'arunacore' });

console.log('Initializing Aruna Core');
logger.info('logger initialized');

const webs = new Socket(3000, logger);

setTimeout(() => {
  webs.finishWebSocket();
}, 10000);

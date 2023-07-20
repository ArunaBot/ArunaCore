import { ConfigurationLoader } from './configuration';
import { Logger } from '@promisepending/logger.js';
import { Socket } from '@arunabot/core-websocket';

console.log('Initializing ArunaCore...');
console.log('Loading configuration...');

const configurationLoader = new ConfigurationLoader();
const configs = configurationLoader.loadConfiguration();

const debug = process.env.NODE_ENV === 'production' ?? configs.debug ?? false;
const prefix = process.env.ARUNACORE_PREFIX ?? configs.id ?? 'arunacore';
const autoLogEnd = configs.autoLogEnd ?? true;
const requireAuth = process.env.ARUNACORE_REQUIREAUTH === 'true' ?? configs.requireAuth ?? false;

var port = parseInt(process.env.ARUNACORE_PORT ?? configs.port?.toString() ?? '3000');
port = isNaN(port) ? configs.port ?? 3000 : port;

const logger = new Logger({ ...(configs.logger ?? { allLineColored: true, coloredBackground: false }), debug, prefix, disableFatalCrash: true });

logger.info('Logger Initialized!');

var masterKey: (string | null) = process.env.ARUNACORE_MASTERKEY ?? configs.masterKey ?? 'changeme';

if (masterKey === 'changeme') {
  logger.error('Master key is not set or is equal to "changeme", please set it in the environment variable ARUNACORE_MASTERKEY or in the configuration file!');
  masterKey = null;
  logger.warn('Running without master key, this will disable some features!');
}

logger.info('Configurations loaded!');

const webs = new Socket(port, logger, { autoLogEnd, requireAuth, masterKey });

logger.info('ArunaCore started!');

webs.once('ready', () => {
  logger.info('ArunaCore is ready!');
});

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

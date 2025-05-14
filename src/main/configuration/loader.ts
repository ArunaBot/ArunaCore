import { FileLoader, getDirnameAuto } from '../utils';
import { Logger } from '@promisepending/logger.js';
import { Configuration, IConfiguration } from '../interfaces';
import path from 'path';

export class ConfigurationLoader {
  private logger: Logger;
  private __dirname = getDirnameAuto(import.meta.url);

  constructor(debug = false) {
    this.logger = new Logger({ prefix: 'config', debug, allLineColored: true });
  }

  /**
   * Load the configuration file, if not found, load the default configuration file and save it
   * @returns {IConfiguration} The configuration file
   */
  public loadConfiguration(): IConfiguration {
    const defaultConfig = FileLoader.load(path.resolve(this.__dirname, '..', '..', '..', 'resources', 'default_config.json'));
    const configs = FileLoader.jsonLoader(path.resolve(this.__dirname, '..', '..', '..', '..', 'config', 'config.json'), defaultConfig) as IConfiguration;
    const configurationKeys = Object.keys(new Configuration());
    const lowercaseKeys = configurationKeys.map((key: string) => key.toLowerCase());
    Object.keys(process.env).forEach((key) => {
      if (key.startsWith('ARUNACORE_')) {
        const envKey = key.replace('ARUNACORE_', '').toLowerCase();

        // @ts-expect-error 2540
        if (lowercaseKeys.includes(envKey) && envKey !== 'fileversion') configs[configurationKeys[lowercaseKeys.indexOf(envKey)]] = process.env[key];
      }
    });
    this.logger.info('Configuration loaded');
    return configs;
  }

  public loadJsonResource(resource: string): unknown {
    const defaultResource = FileLoader.safeLoad(path.resolve(this.__dirname, '..', '..', 'resources', `default_${resource}.json`)) ?? '{}';

    if (defaultResource === '{}') this.logger.warn(`Default ${resource} not found or is empty, using empty object`);

    const resources = FileLoader.jsonLoader(path.resolve(this.__dirname, '..', '..', '..', 'config', `${resource}.json`), defaultResource);

    if (JSON.stringify(resources) === '{}') {
      this.logger.error(`No ${resource} found or is empty!`);
      return null;
    }

    this.logger.info(`${resource} loaded`);
    return resources;
  }
}

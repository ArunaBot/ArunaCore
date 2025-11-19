import { FileLoader, getDirnameAuto } from '../utils';
import { Logger } from '@promisepending/logger.js';
import { Configuration, IConfiguration } from '../interfaces';
import path from 'path';

export class ConfigurationLoader {
  private __dirname = getDirnameAuto(import.meta.url);
  private logger: Logger;

  constructor(debug = false) {
    this.logger = new Logger({ prefix: 'config', debug, allLineColored: true });
  }

  /**
   * Load the configuration file, if not found, load the default configuration file and save it
   * @returns {IConfiguration} The configuration file
   */
  public loadConfiguration(): IConfiguration {
    const defaultConfig = FileLoader.load(path.resolve(this.__dirname, '..', '..', 'resources', 'default_config.json'));
    const configs = FileLoader.jsonLoader(path.resolve(this.__dirname, '..', '..', '..', 'config', 'config.json'), defaultConfig) as IConfiguration;
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
}

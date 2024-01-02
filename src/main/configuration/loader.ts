import { FileLoader, getDirnameAuto } from '../utils';
import { IConfiguration } from '../interfaces/index';
import { Logger } from '@promisepending/logger.js';
import path from 'path';

export class ConfigurationLoader {
  private logger: Logger;
  private __dirname = getDirnameAuto(import.meta.url);

  constructor(debug = false) {
    this.logger = new Logger({ prefix: 'CONFIG', debug, allLineColored: true });
  }

  /**
   * Load the configuration file, if not found, load the default configuration file and save it
   * @returns {IConfiguration} The configuration file
   */
  public loadConfiguration(): IConfiguration {
    const defaultConfig = FileLoader.load(path.resolve(this.__dirname, '..', '..', '..', 'resources', 'default_config.json'));
    const configs = FileLoader.jsonLoader(path.resolve(this.__dirname, '..', '..', '..', '..', 'config', 'config.json'), defaultConfig) as IConfiguration;
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

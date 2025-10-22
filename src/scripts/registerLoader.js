import { pathToFileURL, fileURLToPath } from 'node:url';
import { register } from 'node:module';

register('./main/loader.js', pathToFileURL(import.meta.dirname));

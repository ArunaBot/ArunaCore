import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
register('./build/nodejs/src/main/loader.js', pathToFileURL('./'));

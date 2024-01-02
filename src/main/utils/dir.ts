import { fileURLToPath } from 'url';
import path from 'path';

export function getFilename(metaUrl: string | URL): string {
  const __filename = fileURLToPath(metaUrl);

  return __filename;
}

export function getDirname(metaUrl: string | URL): string {
  const __dirname = path.dirname(getFilename(metaUrl));

  return __dirname;
}

export function getDirnameAuto(metaUrl: string | URL): string {
  const __dirname = path.dirname(fileURLToPath(metaUrl));

  return __dirname;
}

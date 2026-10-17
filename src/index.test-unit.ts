// @vitest-environment node
import { describe, expect, test } from 'vitest';

import * as publicApi from './index.js';

describe('public API', () => {
  test('exports the same functions as fs-utils-sync, under the same names', () => {
    expect(Object.keys(publicApi).sort()).toStrictEqual([
      'copyDirectory',
      'copyFile',
      'createDirectory',
      'createDirectorySymLink',
      'createFileSymLink',
      'deleteDirectory',
      'deleteFile',
      'getDirectoryElements',
      'getPathElement',
      'isDirectory',
      'isFile',
      'isPathWithin',
      'pathExists',
      'readBoundedFile',
      'readBufferFile',
      'readDirectory',
      'readFile',
      'readJSONFile',
      'readTextFile',
      'writeBufferFile',
      'writeFile',
      'writeFileAtomic',
      'writeJSONFile',
      'writeTextFile',
    ]);
  });
});

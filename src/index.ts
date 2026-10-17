// types
export type {
  IDirectoryElementsKeySort,
  IDirectoryElementsOptions,
  IDirectoryPathElements,
  IPathElement,
} from './shared/index.js';

// general actions
export { getPathElement, isPathWithin, pathExists } from './general/index.js';

// directory actions
export {
  copyDirectory,
  createDirectory,
  createDirectorySymLink,
  deleteDirectory,
  getDirectoryElements,
  isDirectory,
  readDirectory,
} from './directories/index.js';

// file actions
export {
  copyFile,
  createFileSymLink,
  deleteFile,
  isFile,
  readBoundedFile,
  readBufferFile,
  readFile,
  readJSONFile,
  readTextFile,
  writeBufferFile,
  writeFile,
  writeFileAtomic,
  writeJSONFile,
  writeTextFile,
} from './files/index.js';

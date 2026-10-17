import type { IDirectoryElementsOptions } from '../shared/index.js';

// the default options for querying directory elements
export const DIRECTORY_ELEMENTS_DEFAULT_OPTIONS: IDirectoryElementsOptions = {
  sortByKey: 'baseName',
  sortOrder: 'asc',
  includeExts: [],
};

import type { IDirectoryElementsOptions } from '../shared/index.js';

import { DIRECTORY_ELEMENTS_DEFAULT_OPTIONS } from './constants.js';

/**
 * Builds the options that will be used to query the directory elements. Properties that are not
 * provided are filled with defaults.
 * @param options?
 * @returns IDirectoryElementsOptions
 */
export const buildDirectoryElementsOptions = (
  options?: Partial<IDirectoryElementsOptions>,
): IDirectoryElementsOptions => ({
  sortByKey: options?.sortByKey ?? DIRECTORY_ELEMENTS_DEFAULT_OPTIONS.sortByKey,
  sortOrder: options?.sortOrder ?? DIRECTORY_ELEMENTS_DEFAULT_OPTIONS.sortOrder,
  includeExts: options?.includeExts ?? DIRECTORY_ELEMENTS_DEFAULT_OPTIONS.includeExts,
});

import { cp, mkdir, readdir, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { encodeError } from 'error-message-utils';
import { sortRecords } from 'web-utils-kit';

import { getPathElement } from '../general/index.js';
import {
  ERRORS,
  type IDirectoryElementsOptions,
  type IDirectoryPathElements,
  type IPathElement,
} from '../shared/index.js';

import { buildDirectoryElementsOptions } from './utilities.js';

/**
 * Verifies if a given path exists and is a directory.
 * @param path
 * @returns Promise<boolean>
 */
export const isDirectory = async (path: string): Promise<boolean> => {
  const el = await getPathElement(path);
  return el === null ? false : el.isDirectory;
};

/**
 * Deletes the directory located in the given path.
 * @param path
 * @returns Promise<void>
 */
export const deleteDirectory = (path: string): Promise<void> =>
  rm(path, { recursive: true, force: true });

/**
 * Creates a directory at a given path.
 * @param path
 * @param deleteIfExists?
 * @returns Promise<void>
 * @throws
 * - DIRECTORY_ALREADY_EXISTS: if the directory already exists and deleteIfExists is falsy
 */
export const createDirectory = async (path: string, deleteIfExists?: boolean): Promise<void> => {
  if (await isDirectory(path)) {
    if (!deleteIfExists) {
      throw new Error(
        encodeError(`The directory ${path} already exists.`, ERRORS.DIRECTORY_ALREADY_EXISTS),
      );
    }
    await deleteDirectory(path);
  }
  await mkdir(path, { recursive: true });
};

/**
 * Copies a directory (and its sub directories) from srcPath to destPath. Keep in mind the destPath
 * is completely overridden.
 * @param srcPath
 * @param destPath
 * @returns Promise<void>
 * @throws
 * - NOT_A_DIRECTORY: if the srcPath is not a directory
 */
export const copyDirectory = async (srcPath: string, destPath: string): Promise<void> => {
  if (!(await isDirectory(srcPath))) {
    throw new Error(
      encodeError(`The srcPath '${srcPath}' is not a directory.`, ERRORS.NOT_A_DIRECTORY),
    );
  }
  await deleteDirectory(destPath);
  await cp(srcPath, destPath, { recursive: true });
};

/**
 * Creates a symlink for the target directory at path.
 * @param target
 * @param path
 * @returns Promise<void>
 * @throws
 * - NON_EXISTENT_DIRECTORY: if the target directory doesn't exist
 * - NOT_A_DIRECTORY: if the target directory is not considered a directory by the OS
 */
export const createDirectorySymLink = async (target: string, path: string): Promise<void> => {
  const el = await getPathElement(target);
  if (el === null) {
    throw new Error(
      encodeError(`The target dir '${target}' does not exist.`, ERRORS.NON_EXISTENT_DIRECTORY),
    );
  }
  if (!el.isDirectory) {
    throw new Error(
      encodeError(`The target dir '${target}' is not a directory.`, ERRORS.NOT_A_DIRECTORY),
    );
  }
  await symlink(target, path, 'dir');
};

/**
 * Reads the contents of a directory and returns their paths, joined to the directory's path.
 * @param path
 * @param recursive?
 * @returns Promise<string[]>
 * @throws
 * - NOT_A_DIRECTORY: if the directory is not considered a directory by the OS.
 */
export const readDirectory = async (
  path: string,
  recursive: boolean = false,
): Promise<string[]> => {
  if (!(await isDirectory(path))) {
    throw new Error(encodeError(`The dir '${path}' is not a directory.`, ERRORS.NOT_A_DIRECTORY));
  }
  const contentPaths = await readdir(path, { encoding: 'utf-8', recursive });
  return contentPaths.map((contentPath) => join(path, contentPath));
};

/**
 * Retrieves all the path elements in the given directory based on the provided options.
 * IMPORTANT: if the includeExts option is provided, make sure to lowercase all
 * extensions (e.g '.json').
 * @param path
 * @param options?
 * @returns Promise<IDirectoryPathElements>
 * @throws
 * - NOT_A_DIRECTORY: if the directory doesn't exist or is not considered a directory by the OS
 */
export const getDirectoryElements = async (
  path: string,
  options?: Partial<IDirectoryElementsOptions>,
): Promise<IDirectoryPathElements> => {
  if (!(await isDirectory(path))) {
    throw new Error(encodeError(`The path '${path} is not a directory'`, ERRORS.NOT_A_DIRECTORY));
  }
  const opts = buildDirectoryElementsOptions(options);

  // read the elements, leaving out any removed between listing and reading it
  const els = (await Promise.all((await readDirectory(path)).map(getPathElement))).filter(
    (el): el is IPathElement => el !== null,
  );

  // distribute the elements and apply the file filter (if any)
  const directories: IPathElement[] = [];
  const files: IPathElement[] = [];
  const symbolicLinks: IPathElement[] = [];
  els.forEach((el) => {
    if (el.isDirectory) {
      directories.push(el);
    } else if (
      el.isFile &&
      (!opts.includeExts.length || opts.includeExts.includes(el.extName.toLowerCase()))
    ) {
      files.push(el);
    } else if (el.isSymbolicLink) {
      symbolicLinks.push(el);
    }
  });

  // sort the elements according to the provided options
  directories.sort(sortRecords(opts.sortByKey, opts.sortOrder));
  files.sort(sortRecords(opts.sortByKey, opts.sortOrder));
  symbolicLinks.sort(sortRecords(opts.sortByKey, opts.sortOrder));
  return { directories, files, symbolicLinks };
};

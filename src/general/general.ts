import { access, lstat } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve, sep } from 'node:path';

import type { IPathElement } from '../shared/index.js';

/**
 * Checks if a path exists (file or directory).
 * @param path
 * @returns Promise<boolean>
 */
export const pathExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Reads the stats of a given path. If the path doesn't exist, it resolves to null.
 * @param path
 * @returns Promise<IPathElement | null>
 */
export const getPathElement = async (path: string): Promise<IPathElement | null> => {
  try {
    const item = await lstat(path);
    return {
      path,
      baseName: basename(path),
      extName: extname(path),
      isFile: item.isFile(),
      isDirectory: item.isDirectory(),
      isSymbolicLink: item.isSymbolicLink(),
      size: item.size,
      creation: Math.round(item.birthtimeMs),
    };
  } catch (e) {
    return null;
  }
};

/**
 * Checks if the target path is the root path itself or is nested inside it. The check is lexical
 * and synchronous: both paths are resolved without touching the filesystem, and symbolic links
 * aren't followed. Sibling paths that share a prefix, such as '/data/app' and '/data/application',
 * aren't nested, and neither is a path on another drive on Windows.
 * @param rootPath
 * @param targetPath
 * @returns boolean
 */
export const isPathWithin = (rootPath: string, targetPath: string): boolean => {
  const relativePath = relative(resolve(rootPath), resolve(targetPath));
  return (
    relativePath === '' ||
    (relativePath !== '..' && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
};

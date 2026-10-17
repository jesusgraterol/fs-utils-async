import { constants, lstat, open, type FileHandle, stat } from 'node:fs/promises';
import { encodeError, extractMessage } from 'error-message-utils';

import { ERRORS } from '../shared/index.js';

/**
 * Reads the permission bits of an existing file, or resolves to undefined when it doesn't exist.
 * @param path
 * @returns Promise<number | undefined>
 */
export const readPermissionBits = async (path: string): Promise<number | undefined> => {
  try {
    // file permissions are bit flags
    // eslint-disable-next-line no-bitwise
    return (await stat(path)).mode & 0o777;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw e;
  }
};

/**
 * Flushes a directory's entries to disk, so a rename inside it survives a crash.
 * @param path
 * @returns Promise<void>
 */
export const syncDirectory = async (path: string): Promise<void> => {
  const handle = await open(path, 'r');
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
};

/**
 * Opens a file for a bounded read without following a symbolic link in its final component.
 * @param path
 * @returns Promise<FileHandle>
 * @throws
 * - NOT_A_FILE: if the path doesn't exist or its final component is a symbolic link
 */
export const openWithoutFollowing = async (path: string): Promise<FileHandle> => {
  try {
    if (process.platform === 'win32') {
      // Windows has no O_NOFOLLOW, so a link swapped in after this check isn't detected
      if ((await lstat(path)).isSymbolicLink()) {
        throw new Error(encodeError(`The file '${path}' is a symbolic link.`, ERRORS.NOT_A_FILE));
      }
      return await open(path, constants.O_RDONLY);
    }
    // O_NONBLOCK keeps a named pipe at the path from blocking the open
    // eslint-disable-next-line no-bitwise
    return await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch (e) {
    const { code } = e as NodeJS.ErrnoException;
    if (code === 'ENOENT' || code === 'ELOOP' || code === 'EMLINK') {
      throw new Error(
        encodeError(
          `The file '${path}' doesn't exist or is a symbolic link: ${extractMessage(e)}`,
          ERRORS.NOT_A_FILE,
        ),
      );
    }
    throw e;
  }
};

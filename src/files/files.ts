import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  copyFile as copyFileNode,
  mkdir,
  open,
  readFile as readFileNode,
  rename,
  rm,
  symlink,
  unlink,
  writeFile as writeFileNode,
} from 'node:fs/promises';
import type { WriteFileOptions } from 'node:fs';
import { dirname, join } from 'node:path';
import { encodeError, extractMessage } from 'error-message-utils';

import { getPathElement } from '../general/index.js';
import { ERRORS, type IReadFileOptions } from '../shared/index.js';

import { BOUNDED_READ_CHUNK_SIZE } from './constants.js';
import { openWithoutFollowing, readPermissionBits, syncDirectory } from './utilities.js';

/**
 * Verifies if a given path exists and is a file.
 * @param path
 * @returns Promise<boolean>
 */
export const isFile = async (path: string): Promise<boolean> => {
  const el = await getPathElement(path);
  return el === null ? false : el.isFile;
};

/**
 * Creates the base directory for a file in case it doesn't exist and then it writes the file.
 * @param path
 * @param data
 * @param options?
 * @returns Promise<void>
 */
export const writeFile = async (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options?: WriteFileOptions,
): Promise<void> => {
  // a recursive mkdir succeeds when a concurrent call already created the directory
  await mkdir(dirname(path), { recursive: true });
  await writeFileNode(path, data, options);
};

/**
 * Writes a text file on a given path.
 * @param path
 * @param data
 * @returns Promise<void>
 * @throws
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if data is not a valid string.
 */
export const writeTextFile = async (path: string, data: string): Promise<void> => {
  if (typeof data !== 'string' || !data.length) {
    throw new Error(
      encodeError(
        `The provided data for the file '${path}' is empty or invalid. Received: ${data}`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
  await writeFile(path, data, { encoding: 'utf-8' });
};

/**
 * Writes a JSON file on a given path. If an object is provided, it will be stringified.
 * @param path
 * @param data
 * @param space?
 * @returns Promise<void>
 * @throws
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the JSON content cannot be stringified
 */
export const writeJSONFile = async <T = Record<string, any>>(
  path: string,
  data: T | string,
  space: number = 2,
): Promise<void> => {
  let fileData: string;
  try {
    fileData = typeof data === 'string' ? data : JSON.stringify(data, undefined, space);
  } catch (e) {
    throw new Error(
      encodeError(
        `The JSON data for the file '${path}' could not be stringified: ${extractMessage(e)}`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
  await writeTextFile(path, fileData);
};

/**
 * Writes a Buffer file on a given path.
 * @param path
 * @param data
 * @returns Promise<void>
 * @throws
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the provided data is not a valid Buffer
 */
export const writeBufferFile = async (path: string, data: Buffer): Promise<void> => {
  if (!Buffer.isBuffer(data)) {
    throw new Error(
      encodeError(
        `The provided data is not a valid Buffer. Received: ${data}`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
  await writeFile(path, data);
};

/**
 * Reads and returns the contents of a file.
 * @param path
 * @param options?
 * @returns Promise<string | Buffer>
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 */
export const readFile = async (
  path: string,
  options: IReadFileOptions = null,
): Promise<string | Buffer> => {
  if (!(await isFile(path))) {
    throw new Error(encodeError(`The file '${path}' is not a file.`, ERRORS.NOT_A_FILE));
  }
  return readFileNode(path, options);
};

/**
 * Reads a text file and returns its contents.
 * @param path
 * @returns Promise<string>
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 */
export const readTextFile = async (path: string): Promise<string> => {
  const content = await readFile(path, { encoding: 'utf-8' });
  if (typeof content !== 'string' || !content.length) {
    throw new Error(
      encodeError(
        `The file '${path}' is empty or invalid.`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
  return content;
};

/**
 * Reads a text file, parses and returns its contents.
 * @param path
 * @returns Promise<T>
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or invalid
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the file's JSON content cannot be parsed
 */
export const readJSONFile = async <T = Record<string, any>>(path: string): Promise<T> => {
  const content = await readTextFile(path);
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(
      encodeError(
        `The JSON file '${path}' cound not be parsed: ${extractMessage(e)}`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
};

/**
 * Reads a Buffer file and returns its contents.
 * @param path
 * @returns Promise<Buffer>
 * @throws
 * - NOT_A_FILE: if the path is not recognized by the OS as a file or if it doesn't exist
 * - FILE_CONTENT_IS_EMPTY_OR_INVALID: if the content of the file is empty or is not a Buffer
 */
export const readBufferFile = async (path: string): Promise<Buffer> => {
  const content = await readFile(path, null);
  if (!Buffer.isBuffer(content) || !content.toString().length) {
    throw new Error(
      encodeError(
        `The file '${path}' is not a valid Buffer. Received: ${content}`,
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      ),
    );
  }
  return content;
};

/**
 * Copies a file from srcPath to destPath, replacing the destination if it exists.
 * @param srcPath
 * @param destPath
 * @returns Promise<void>
 * @throws
 * - NOT_A_FILE: if the srcPath doesnt exist or is not recognized as a file by the OS
 */
export const copyFile = async (srcPath: string, destPath: string): Promise<void> => {
  if (!(await isFile(srcPath))) {
    throw new Error(encodeError(`The file '${srcPath}' is not a file.`, ERRORS.NOT_A_FILE));
  }
  await copyFileNode(srcPath, destPath);
};

/**
 * Deletes the file located at the provided path.
 * @param path
 * @returns Promise<void>
 * @throws
 * - NOT_A_FILE: if the path doesnt exist or is not recognized as a file by the OS
 */
export const deleteFile = async (path: string): Promise<void> => {
  if (!(await isFile(path))) {
    throw new Error(encodeError(`The file '${path} is not a file.'`, ERRORS.NOT_A_FILE));
  }
  await unlink(path);
};

/**
 * Creates a symlink for a given file.
 * @param target
 * @param path
 * @returns Promise<void>
 * @throws
 * - NON_EXISTENT_FILE: if the target file does not exist
 * - NOT_A_FILE: if the path is not recognized as a file by the OS
 */
export const createFileSymLink = async (target: string, path: string): Promise<void> => {
  const el = await getPathElement(target);
  if (el === null) {
    throw new Error(
      encodeError(`The target file '${target}' does not exist.`, ERRORS.NON_EXISTENT_FILE),
    );
  }
  if (!el.isFile) {
    throw new Error(encodeError(`The target file '${target}' is not a file.`, ERRORS.NOT_A_FILE));
  }
  await symlink(target, path, 'file');
};

/**
 * Writes a file atomically: readers see either the previous content or the complete new content,
 * never a partial write. The data goes to a temporary file in the same directory, which is
 * flushed to disk and then renamed over the path. On POSIX, the directory is flushed as well.
 *
 * An explicit mode wins. Without one, a replaced file keeps its permission bits, and a new file
 * gets the platform default, as with writeFile. The temporary file is never readable more widely
 * than the final mode. The owner of a replaced file isn't preserved.
 *
 * When writing fails before the rename, the temporary file is removed, the destination is left
 * untouched and the original error is rethrown. If flushing the directory fails after the rename,
 * the promise rejects even though the destination already holds the new content.
 * @param path
 * @param data
 * @param mode? the permission bits of the written file, for example 0o600
 * @returns Promise<void>
 */
export const writeFileAtomic = async (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  mode?: number,
): Promise<void> => {
  const dirName = dirname(path);
  await mkdir(dirName, { recursive: true });
  const finalMode = mode ?? (await readPermissionBits(path));
  const tempPath = join(dirName, `.${randomUUID()}.tmp`);
  let isRenamed = false;
  try {
    // a known final mode is applied with chmod, so the umask can't change it
    const handle = await open(tempPath, 'wx', finalMode === undefined ? 0o666 : 0o600);
    try {
      if (finalMode !== undefined) {
        await handle.chmod(finalMode);
      }
      await handle.writeFile(data);
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tempPath, path);
    isRenamed = true;
  } finally {
    if (!isRenamed) {
      await rm(tempPath, { force: true });
    }
  }
  if (process.platform !== 'win32') {
    await syncDirectory(dirName);
  }
};

/**
 * Reads a regular file of at most maxBytes bytes and returns its content. It never follows a
 * symbolic link in the path's final component, but links in parent directories are followed, so
 * callers that need containment should combine it with isPathWithin and their own checks of the
 * parent directories. It reads at most maxBytes + 1 bytes, even when the file grows while it is
 * being read.
 * @param path
 * @param maxBytes
 * @returns Promise<Buffer>
 * @throws
 * - NOT_A_FILE: if the path doesn't exist, its final component is a symbolic link, or it isn't a regular file
 * - FILE_TOO_LARGE: if the file holds more than maxBytes bytes
 */
export const readBoundedFile = async (path: string, maxBytes: number): Promise<Buffer> => {
  const handle = await openWithoutFollowing(path);
  try {
    const stats = await handle.stat();
    if (!stats.isFile()) {
      throw new Error(encodeError(`The file '${path}' is not a file.`, ERRORS.NOT_A_FILE));
    }
    const tooLarge = () =>
      new Error(
        encodeError(`The file '${path}' is larger than ${maxBytes} bytes.`, ERRORS.FILE_TOO_LARGE),
      );
    if (stats.size > maxBytes) {
      throw tooLarge();
    }
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    while (totalBytes <= maxBytes) {
      const chunk = Buffer.allocUnsafe(
        Math.min(BOUNDED_READ_CHUNK_SIZE, maxBytes + 1 - totalBytes),
      );
      // the chunks are read in order, one after another
      // eslint-disable-next-line no-await-in-loop
      const { bytesRead } = await handle.read(chunk, 0, chunk.length, totalBytes);
      if (bytesRead === 0) {
        break;
      }
      chunks.push(chunk.subarray(0, bytesRead));
      totalBytes += bytesRead;
    }
    if (totalBytes > maxBytes) {
      throw tooLarge();
    }
    return Buffer.concat(chunks, totalBytes);
  } finally {
    await handle.close();
  }
};

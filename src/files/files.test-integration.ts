// @vitest-environment node
import { Buffer } from 'node:buffer';
import { execFile } from 'node:child_process';
import {
  chmod,
  mkdir,
  mkdtemp,
  readdir,
  readFile as readRaw,
  rm,
  stat,
  symlink,
  writeFile as writeRaw,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { createDirectory, isDirectory } from '../directories/index.js';
import { getPathElement } from '../general/index.js';
import { ERRORS } from '../shared/index.js';

import {
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
} from './files.js';

// whether the tests run on Windows, where POSIX permissions, FIFOs and O_NOFOLLOW don't apply
const IS_WINDOWS = process.platform === 'win32';

describe('File Actions', () => {
  let root: string;

  // builds a path inside of the base directory, which each test starts without
  const p = (path?: string): string =>
    typeof path === 'string' ? join(root, 'fs-test-dir', path) : join(root, 'fs-test-dir');

  // reads the permission bits of a path
  // eslint-disable-next-line no-bitwise
  const permissionBits = async (path: string): Promise<number> => (await stat(path)).mode & 0o777;

  // lists the temporary files writeFileAtomic left in a directory
  const listTemporaryFiles = async (path: string): Promise<string[]> =>
    (await readdir(path)).filter((name) => name.endsWith('.tmp'));

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'fs-utils-async-'));
  });

  beforeEach(async () => {
    await rm(p(), { recursive: true, force: true });
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  describe('isFile', () => {
    test('can determine if a path is a file', async () => {
      expect(await isFile(p())).toBe(false);
      await createDirectory(p());
      expect(await isFile(p())).toBe(false);
      expect(await isFile(p('some-file.txt'))).toBe(false);
      await writeTextFile(p('some-file.txt'), 'Hello World!');
      expect(await isFile(p('some-file.txt'))).toBe(true);
    });
  });

  describe('writeFile & readFile', () => {
    test('creates missing parent directories, also when called concurrently', async () => {
      await Promise.all([writeFile(p('a/b/one.txt'), 'one'), writeFile(p('a/b/two.txt'), 'two')]);
      expect(await readFile(p('a/b/one.txt'), 'utf-8')).toBe('one');
      expect(await readFile(p('a/b/two.txt'))).toStrictEqual(Buffer.from('two'));
    });

    test('rejects when reading a path that is not a file', async () => {
      await expect(readFile(p('missing.txt'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });
  });

  describe('writeTextFile & readTextFile', () => {
    test('attempting to write an empty file rejects', async () => {
      await expect(writeTextFile(p('file.txt'), '')).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });

    test('can write and read a text file', async () => {
      await writeTextFile(p('file.txt'), 'Hello World!');
      expect(await readTextFile(p('file.txt'))).toBe('Hello World!');
    });

    test('attempting to read a text file that doesnt exist rejects', async () => {
      await expect(readTextFile(p('file.txt'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test('attempting to read an empty text file rejects', async () => {
      await mkdir(p());
      await writeRaw(p('file.txt'), '');
      await expect(readTextFile(p('file.txt'))).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });
  });

  describe('writeJSONFile & readJSONFile', () => {
    test('attempting to write an empty or invalid file rejects', async () => {
      await expect(writeJSONFile(p('file.json'), '')).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
      await expect(writeJSONFile(p('file.json'), { value: 1n })).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });

    test('can write and read a JSON file by providing a string', async () => {
      await writeJSONFile(p('file.json'), JSON.stringify({ foo: 'bar', baz: true, tan: 123 }));
      expect(await readJSONFile(p('file.json'))).toStrictEqual({ foo: 'bar', baz: true, tan: 123 });
    });

    test('can write and read a JSON file by providing an object', async () => {
      await writeJSONFile(p('file.json'), { foo: 'bar', baz: true, tan: 123 });
      expect(await readJSONFile(p('file.json'))).toStrictEqual({ foo: 'bar', baz: true, tan: 123 });
    });

    test('attempting to read a JSON file that doesnt exist rejects', async () => {
      await expect(readJSONFile(p('file.json'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test('attempting to read an invalid JSON file rejects', async () => {
      await writeTextFile(p('file.json'), '{ invalid');
      await expect(readJSONFile(p('file.json'))).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });
  });

  describe('writeBufferFile & readBufferFile', () => {
    test('attempting to write an invalid Buffer rejects', async () => {
      await expect(writeBufferFile(p('file'), undefined as unknown as Buffer)).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });

    test('can write and read a Buffer file', async () => {
      await writeBufferFile(p('file'), Buffer.from('This is a Buffer File!'));
      expect((await readBufferFile(p('file'))).toString()).toBe('This is a Buffer File!');
    });

    test('attempting to read a Buffer file that doesnt exist rejects', async () => {
      await expect(readBufferFile(p('file'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test('attempting to read an empty Buffer file rejects', async () => {
      await mkdir(p());
      await writeRaw(p('file'), '');
      await expect(readBufferFile(p('file'))).rejects.toThrowError(
        ERRORS.FILE_CONTENT_IS_EMPTY_OR_INVALID,
      );
    });
  });

  describe('copyFile', () => {
    test('rejects if the source path is not a file', async () => {
      await expect(copyFile(p('file.txt'), p('file-b.txt'))).rejects.toThrowError(
        ERRORS.NOT_A_FILE,
      );
    });

    test('can copy a file, overriding the destination if it exists', async () => {
      await writeTextFile(p('file-a.txt'), 'This is file-a.txt!');
      await writeTextFile(p('file-b.txt'), 'This is file-b.txt!');
      await copyFile(p('file-b.txt'), p('file-a.txt'));
      expect(await readTextFile(p('file-a.txt'))).toBe('This is file-b.txt!');
      await copyFile(p('file-a.txt'), p('file-c.txt'));
      expect(await readTextFile(p('file-c.txt'))).toBe('This is file-b.txt!');
    });
  });

  describe('deleteFile', () => {
    test('can delete a file', async () => {
      await writeTextFile(p('some-file.txt'), 'Hello World!');
      await deleteFile(p('some-file.txt'));
      expect(await isFile(p('some-file.txt'))).toBe(false);
    });

    test("rejects if the file does not exist or if it isn't a file", async () => {
      await expect(deleteFile(p('some-file.txt'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
      await createDirectory(p());
      await expect(deleteFile(p())).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test('rejects if attempting to delete a symlink', async () => {
      await writeTextFile(p('some-file.txt'), 'Hello World!');
      await createFileSymLink(p('some-file.txt'), p('some-file-symlink.txt'));
      await expect(deleteFile(p('some-file-symlink.txt'))).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });
  });

  describe('createFileSymLink', () => {
    test('can create a symbolic link for a file', async () => {
      await writeTextFile(p('test-file.txt'), 'Hello World!');
      await createFileSymLink(p('test-file.txt'), p('test-file-symlink.txt'));
      expect((await getPathElement(p('test-file.txt')))!.isSymbolicLink).toBe(false);
      expect((await getPathElement(p('test-file-symlink.txt')))!.isSymbolicLink).toBe(true);
    });

    test('rejects if the target file does not exist', async () => {
      await expect(
        createFileSymLink(p('test-file.txt'), p('test-file-symlink.txt')),
      ).rejects.toThrowError(ERRORS.NON_EXISTENT_FILE);
    });

    test('rejects if the target file is not a file', async () => {
      await createDirectory(p('some-file'));
      await expect(createFileSymLink(p('some-file'), p('some-file.txt'))).rejects.toThrowError(
        ERRORS.NOT_A_FILE,
      );
    });
  });

  describe('writeFileAtomic', () => {
    test('creates missing parent directories and writes the content', async () => {
      await writeFileAtomic(p('nested/dir/file.txt'), 'Hello World!');
      expect(await readRaw(p('nested/dir/file.txt'), 'utf-8')).toBe('Hello World!');
      expect(await listTemporaryFiles(p('nested/dir'))).toStrictEqual([]);
    });

    test('replaces existing content and accepts bytes and empty content', async () => {
      await writeTextFile(p('file.bin'), 'old content');
      await writeFileAtomic(p('file.bin'), Buffer.from([1, 2, 3]));
      expect(await readRaw(p('file.bin'))).toStrictEqual(Buffer.from([1, 2, 3]));
      await writeFileAtomic(p('file.bin'), '');
      expect(await readRaw(p('file.bin'), 'utf-8')).toBe('');
      expect(await listTemporaryFiles(p())).toStrictEqual([]);
    });

    test('writes a destination whose name is 255 bytes long', async () => {
      const name = `${'a'.repeat(251)}.txt`;
      await writeFileAtomic(p(name), 'Hello World!');
      expect(await readRaw(p(name), 'utf-8')).toBe('Hello World!');
    });

    test.skipIf(IS_WINDOWS)('applies an explicit mode', async () => {
      await writeFileAtomic(p('secret.txt'), 'Hello World!', 0o640);
      expect(await permissionBits(p('secret.txt'))).toBe(0o640);
    });

    test.skipIf(IS_WINDOWS)('keeps the permissions of a replaced file without a mode', async () => {
      await writeTextFile(p('secret.txt'), 'old content');
      await chmod(p('secret.txt'), 0o600);
      await writeFileAtomic(p('secret.txt'), 'new content');
      expect(await permissionBits(p('secret.txt'))).toBe(0o600);
      expect(await readRaw(p('secret.txt'), 'utf-8')).toBe('new content');
    });

    test.skipIf(IS_WINDOWS)('gives a new file the same permissions as writeFile', async () => {
      await writeFile(p('plain.txt'), 'Hello World!');
      await writeFileAtomic(p('atomic.txt'), 'Hello World!');
      expect(await permissionBits(p('atomic.txt'))).toBe(await permissionBits(p('plain.txt')));
    });

    test('removes the temporary file and rejects when the rename fails', async () => {
      await createDirectory(p('target'));
      await expect(writeFileAtomic(p('target'), 'Hello World!')).rejects.toThrowError();
      expect(await isDirectory(p('target'))).toBe(true);
      expect(await listTemporaryFiles(p())).toStrictEqual([]);
    });
  });

  describe('readBoundedFile', () => {
    test('reads content of exactly maxBytes bytes', async () => {
      await writeTextFile(p('file.txt'), 'abcd');
      expect(await readBoundedFile(p('file.txt'), 4)).toStrictEqual(Buffer.from('abcd'));
    });

    test('reads an empty file', async () => {
      await writeFile(p('empty.txt'), '');
      expect(await readBoundedFile(p('empty.txt'), 4)).toStrictEqual(Buffer.alloc(0));
    });

    test('reads content larger than one read chunk', async () => {
      const content = Buffer.alloc(200_000, 7);
      await writeFile(p('large.bin'), content);
      expect(await readBoundedFile(p('large.bin'), 200_000)).toStrictEqual(content);
    });

    test('rejects when the content exceeds maxBytes', async () => {
      await writeTextFile(p('file.txt'), 'abcde');
      await expect(readBoundedFile(p('file.txt'), 4)).rejects.toThrowError(ERRORS.FILE_TOO_LARGE);
    });

    test('rejects when the path does not exist', async () => {
      await expect(readBoundedFile(p('missing.txt'), 4)).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test('rejects when the path is a directory', async () => {
      await createDirectory(p('some-dir'));
      await expect(readBoundedFile(p('some-dir'), 4)).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test.skipIf(IS_WINDOWS)(
      'rejects when the final path component is a symbolic link',
      async () => {
        await writeTextFile(p('file.txt'), 'abcd');
        await createFileSymLink(p('file.txt'), p('link.txt'));
        await expect(readBoundedFile(p('link.txt'), 4)).rejects.toThrowError(ERRORS.NOT_A_FILE);
      },
    );

    test.skipIf(IS_WINDOWS)('rejects for a named pipe without blocking', async () => {
      await createDirectory(p());
      await promisify(execFile)('mkfifo', [p('pipe')]);
      await expect(readBoundedFile(p('pipe'), 4)).rejects.toThrowError(ERRORS.NOT_A_FILE);
    });

    test.skipIf(IS_WINDOWS)('follows symbolic links in parent directories', async () => {
      await writeTextFile(p('real/file.txt'), 'abcd');
      await symlink(p('real'), p('linked'), 'dir');
      expect(await readBoundedFile(p('linked/file.txt'), 4)).toStrictEqual(Buffer.from('abcd'));
    });
  });
});

# Filesystem Utils Async

The `fs-utils-async` package provides a collection of well-tested, asynchronous file system utility functions built on `node:fs/promises`. It promotes consistency and readability across projects by providing a unified approach to common file operations, saving you development time and improving code quality.

Its API matches [`fs-utils-sync`](https://www.npmjs.com/package/fs-utils-sync) name for name: the same functions, parameters, error codes and validation rules, except that every operation returns a promise. `isPathWithin` is the one exception, because it never touches the filesystem: it stays synchronous in both packages.



</br>

## Getting Started

Install the package:
```bash
npm i -S fs-utils-async
```

### Examples
```
project
    │
    some-dir/
    │    └───...
    │
    some-file.json
```
```typescript
import { pathExists, getPathElement, deleteFile } from 'fs-utils-async';

await pathExists('project'); // true
await pathExists('project/some-dir'); // true
await pathExists('project/some-other-dir'); // false
await pathExists('project/some-file.json'); // true
await pathExists('project/other-file.json'); // false

await getPathElement('project/other-file.json'); // null
await getPathElement('project/some-file.json');
// {
//    path: 'project/some-file.json',
//    baseName: 'some-file.json',
//    extName: '.json',
//    isFile: true,
//    isDirectory: false,
//    isSymbolicLink: false,
//    size: 8647,
//    creation: 1715264137289,
// }

await deleteFile('project/some-file.json');
await getPathElement('project/some-file.json'); // null
```





<br/>

## API Reference

### General Actions

<details>
  <summary><code>pathExists</code></summary>
  <br/>
  
  Checks if a path exists (file or directory).
  ```typescript
  import { pathExists } from 'fs-utils-async';

  await pathExists('some-existent-dir'); // true
  await pathExists('some-non-existent-file.json'); // false
  ```
  <br/>
</details>

<details>
  <summary><code>getPathElement</code></summary>
  <br/>
  
  Reads the content of a given path and returns the stats. If the path doesn't exist, it resolves to `null`
  ```typescript
  import { getPathElement } from 'fs-utils-async';

  await getPathElement('project/some-file.json');
  // {
  //    path: 'project/some-file.json',
  //    baseName: 'some-file.json',
  //    extName: '.json',
  //    isFile: true,
  //    isDirectory: false,
  //    isSymbolicLink: false,
  //    size: 8647,
  //    creation: 1715264137289,
  // }
  ```
  <br/>
</details>

<details>
  <summary><code>isPathWithin</code></summary>
  <br/>
  
  Checks if a target path is the root path itself or is nested inside it. It is synchronous, because the check is lexical: both paths are resolved without touching the filesystem, and symbolic links aren't followed. Sibling paths that share a prefix aren't nested, and neither is a path on another drive on Windows.
  ```typescript
  import { isPathWithin } from 'fs-utils-async';

  isPathWithin('/data/app', '/data/app'); // true
  isPathWithin('/data/app', '/data/app/logs/today.log'); // true
  isPathWithin('/data/app', '/data/app/../secrets'); // false
  isPathWithin('/data/app', '/data/application'); // false
  ```
  <br/>
</details>

### Directory Actions

<details>
  <summary><code>isDirectory</code></summary>
  <br/>
  
  Verifies if a given path exists and is a directory.
  ```typescript
  import { isDirectory } from 'fs-utils-async';

  await isDirectory('some-existent-dir'); // true
  await isDirectory('some-non-existent-dir'); // false
  await isDirectory('some-existent-file.json'); // false
  ```
  <br/>
</details>

<details>
  <summary><code>deleteDirectory</code></summary>
  <br/>
  
  Deletes the directory located in the given path.
  ```typescript
  import { isDirectory, deleteDirectory } from 'fs-utils-async';

  await isDirectory('some-existent-dir'); // true
  await deleteDirectory('some-existent-dir');
  await isDirectory('some-existent-dir'); // false
  ```
  <br/>
</details>

<details>
  <summary><code>createDirectory</code></summary>
  <br/>
  
  Creates a directory at a given path.
  ```typescript
  import { isDirectory, createDirectory } from 'fs-utils-async';

  await isDirectory('some-dir'); // false
  await createDirectory('some-dir');
  await isDirectory('some-dir'); // true
  ```
  <br/>
</details>

<details>
  <summary><code>copyDirectory</code></summary>
  <br/>
  
  It copies a directory (and sub directories) from `srcPath` to `destPath`. Keep in mind the `destPath` is completely overridden.
  ```typescript
  import { isDirectory, copyDirectory } from 'fs-utils-async';

  await isDirectory('some-dir'); // true
  await isDirectory('my-copy'); // false
  await copyDirectory('some-dir', 'my-copy');
  await isDirectory('my-copy'); // true
  ```
  <br/>
</details>

<details>
  <summary><code>createDirectorySymLink</code></summary>
  <br/>
  
  Creates a symlink for the `target` directory at `path`.
  ```typescript
  import { createDirectorySymLink } from 'fs-utils-async';

  await createDirectorySymLink('some-dir', 'some-dir-symlink');
  ```
  <br/>
</details>

<details>
  <summary><code>readDirectory</code></summary>
  <br/>
  
  Reads the contents of a directory based on the provided options and returns them.
  ```typescript
  import { readDirectory } from 'fs-utils-async';

  await readDirectory('some-dir', true);
  // [
  //   'some-dir/file-01.txt',
  //   'some-dir/file-02.json',
  //   'some-dir/inner',
  //   'some-dir/inner/inner-01.txt'
  // ]
  ```
  <br/>
</details>

<details>
  <summary><code>getDirectoryElements</code></summary>
  <br/>
  
  Retrieves all the path elements in the given directory based on the provided options. 
  IMPORTANT: if the `includeExts` option is provided, make sure to lowercase all extensions (e.g `'.json'`).
  ```typescript
  import { getDirectoryElements } from 'fs-utils-async';

  await getDirectoryElements('fs-test-dir');
  // {
  //   directories: [
  //     {
  //       path: 'fs-test-dir/another-dir',
  //       baseName: 'another-dir',
  //       extName: '',
  //       isFile: false,
  //       isDirectory: true,
  //       isSymbolicLink: false,
  //       size: 4096,
  //       creation: 1733515026497
  //     },
  //     {
  //       path: 'fs-test-dir/some-dir',
  //       baseName: 'some-dir',
  //       extName: '',
  //       isFile: false,
  //       isDirectory: true,
  //       isSymbolicLink: false,
  //       size: 4096,
  //       creation: 1733515026497
  //     }
  //   ],
  //   files: [
  //     {
  //       path: 'fs-test-dir/aafile.json',
  //       baseName: 'aafile.json',
  //       extName: '.json',
  //       isFile: true,
  //       isDirectory: false,
  //       isSymbolicLink: false,
  //       size: 18,
  //       creation: 1733515026497
  //     },
  //     {
  //       path: 'fs-test-dir/afile.txt',
  //       baseName: 'afile.txt',
  //       extName: '.txt',
  //       isFile: true,
  //       isDirectory: false,
  //       isSymbolicLink: false,
  //       size: 12,
  //       creation: 1733515026497
  //     }
  //   ],
  //   symbolicLinks: [
  //     {
  //       path: 'fs-test-dir/aafile-sl.json',
  //       baseName: 'aafile-sl.json',
  //       extName: '.json',
  //       isFile: false,
  //       isDirectory: false,
  //       isSymbolicLink: true,
  //       size: 23,
  //       creation: 1733515026497
  //     },
  //     {
  //       path: 'fs-test-dir/some-dir-sl',
  //       baseName: 'some-dir-sl',
  //       extName: '',
  //       isFile: false,
  //       isDirectory: false,
  //       isSymbolicLink: true,
  //       size: 20,
  //       creation: 1733515026497
  //     }
  //   ]
  // }
  ```
  <br/>
</details>


### File Actions

<details>
  <summary><code>isFile</code></summary>
  <br/>
  
  Verifies if a given path exists and is a file.
  ```typescript
  import { isFile } from 'fs-utils-async';

  await isFile('existent-file.json'); // true
  await isFile('non-existent-file.json'); // false
  ```
  <br/>
</details>

<details>
  <summary><code>writeFile</code></summary>
  <br/>
  
  Creates the base directory for a file in case it doesn't exist and then it writes the file.
  ```typescript
  import { writeFile } from 'fs-utils-async';

  await writeFile('test-file.txt', 'Hello World!', { encoding: 'utf-8' });
  ```
  <br/>
</details>

<details>
  <summary><code>writeTextFile</code></summary>
  <br/>
  
  Writes a text file on a given path.
  ```typescript
  import { writeTextFile } from 'fs-utils-async';

  await writeTextFile('test-file.txt', 'Hello World!');
  ```
  <br/>
</details>

<details>
  <summary><code>writeJSONFile</code></summary>
  <br/>
  
  Writes a JSON file on a given path. If an object is provided, it will be stringified.
  ```typescript
  import { writeJSONFile } from 'fs-utils-async';

  await writeJSONFile('test-file.json', { id: 1, nickname: 'test-user' });
  ```
  <br/>
</details>

<details>
  <summary><code>writeBufferFile</code></summary>
  <br/>
  
  Writes a Buffer file on a given path. If an object is provided, it will be stringified.
  ```typescript
  import { Buffer } from 'node:buffer';
  import { writeBufferFile } from 'fs-utils-async';

  await writeBufferFile('test-file', Buffer.from('Hello World!'));
  ```
  <br/>
</details>

<details>
  <summary><code>readFile</code></summary>
  <br/>
  
  Reads and returns the contents of a file.
  ```typescript
  import { readFile } from 'fs-utils-async';

  await readFile('test-file.txt', { encoding: 'utf-8' }); // 'Hello World!'
  ```
  <br/>
</details>

<details>
  <summary><code>readTextFile</code></summary>
  <br/>
  
  Reads a text file and returns its contents.
  ```typescript
  import { readTextFile } from 'fs-utils-async';

  await readTextFile('test-file.txt'); // 'Hello World!'
  ```
  <br/>
</details>

<details>
  <summary><code>readJSONFile</code></summary>
  <br/>
  
  Reads a text file, parses and returns its contents.
  ```typescript
  import { readJSONFile } from 'fs-utils-async';

  await readJSONFile<IUser>('test-file.json'); // { id: 1, nickname: 'test-user' }
  ```
  <br/>
</details>

<details>
  <summary><code>readBufferFile</code></summary>
  <br/>
  
  Reads a Buffer file and returns its contents.
  ```typescript
  import { readBufferFile } from 'fs-utils-async';

  await readBufferFile('test-file'); // <Buffer 48 65 6c 6c 6f 20 57 6f 72 6c 64 21>
  ```
  <br/>
</details>

<details>
  <summary><code>copyFile</code></summary>
  <br/>
  
  Copies a file from `srcPath` to `destPath`, replacing the destination if it exists.
  ```typescript
  import { isFile, copyFile } from 'fs-utils-async';

  await isFile('file-a.json'); // true
  await isFile('file-b.json'); // false
  await copyFile('file-a.json', 'file-b.json');
  await isFile('file-b.json'); // true
  ```
  <br/>
</details>

<details>
  <summary><code>deleteFile</code></summary>
  <br/>
  
  Deletes the file located at the provided `path`.
  ```typescript
  import { isFile, deleteFile } from 'fs-utils-async';

  await isFile('file-a.json'); // true
  await deleteFile('file-a.json');
  await isFile('file-a.json'); // false
  ```
  <br/>
</details>

<details>
  <summary><code>createFileSymLink</code></summary>
  <br/>
  
  Creates a symlink for a given file.
  ```typescript
  import { createFileSymLink } from 'fs-utils-async';

  await createFileSymLink('test-file.txt', 'test-file-symlink.txt');
  ```
  <br/>
</details>

<details>
  <summary><code>writeFileAtomic</code></summary>
  <br/>
  
  Writes a file atomically, so readers see either the previous content or the complete new content, never a partial write. The data goes to a temporary file in the same directory, which is flushed to disk and renamed over the path. On POSIX, the directory is flushed as well. Missing parent directories are created, also when several calls write into the same new directory at once.

  Permissions: an explicit `mode` wins. Without one, a replaced file keeps its permission bits, and a new file gets the platform default, as with `writeFile`. The temporary file is never readable more widely than the final mode. The owner of a replaced file isn't preserved.

  Failures: when writing fails before the rename, the temporary file is removed, the destination is left untouched and the original error is rethrown. If flushing the directory fails after the rename, the promise rejects even though the destination already holds the new content.
  ```typescript
  import { writeFileAtomic } from 'fs-utils-async';

  await writeFileAtomic('project/state.json', JSON.stringify({ step: 2 }));
  await writeFileAtomic('project/.env.local', 'API_KEY=example', 0o600);
  ```
  <br/>
</details>

<details>
  <summary><code>readBoundedFile</code></summary>
  <br/>
  
  Reads a regular file of at most `maxBytes` bytes and returns its content as a `Buffer`. It reads at most `maxBytes + 1` bytes, even when the file grows while it is being read, and a named pipe at the path can't make it block.

  It never follows a symbolic link in the path's final component. Symbolic links in parent directories are followed, so code that must stay inside a directory should combine it with `isPathWithin` and its own checks of the parent directories. On Windows, which has no `O_NOFOLLOW`, the link check runs just before opening, so a link swapped in between isn't detected.

  It throws `NOT_A_FILE` when the path doesn't exist, its final component is a symbolic link, or it isn't a regular file, and `FILE_TOO_LARGE` when the file holds more than `maxBytes` bytes.
  ```typescript
  import { readBoundedFile } from 'fs-utils-async';

  (await readBoundedFile('project/state.json', 1024 * 1024)).toString('utf-8');
  // '{"step":2}'
  ```
  <br/>
</details>





<br/>

## Types

<details>
  <summary><code>IPathElement</code></summary>
  <br/>
  
  The most relevant information regarding a path element, extracted by making use of the `lstat` function.
  ```typescript
  interface IPathElement {
    // the relative path of the el
    path: string;

    // the base name of the el
    baseName: string;

    // the ext of the el (e.g '.json'). If the el has no ext, it will be an empty string ('')
    extName: string;

    // true if the el is a file
    isFile: boolean;

    // true if the el is a directory
    isDirectory: boolean;

    // true if the el is a symbolic link
    isSymbolicLink: boolean; // when this property is true, isFile & isDirectory are false

    // the size in bytes of the el
    size: number;

    // the date in which the el was created (in milliseconds)
    creation: number;
  }
  ```
  <br/>
</details>

<details>
  <summary><code>IDirectoryElementsOptions</code></summary>
  <br/>
  
  When querying the path elements from within a directory, a series of filters and sorting options can be provided.
  ```typescript
  import { ISortDirection } from 'web-utils-kit';

  type IDirectoryElementsKeySort = 'baseName' | 'size' | 'creation';

  type IDirectoryElementsOptions = {
    // the key that will be used to sort the elements. Defaults to 'baseName'
    sortByKey: IDirectoryElementsKeySort;

    // the sort order that will be applied to the elements. Defaults to 'asc'
    sortOrder: ISortDirection;

    // the list of file extensions that will be included. Defaults to [] (includes all exts)
    includeExts: string[];
  };
  ```
  <br/>
</details>

<details>
  <summary><code>IDirectoryPathElements</code></summary>
  <br/>
  
  The output emitted when retrieving all the path elements within a directory.
  ```typescript
  type IDirectoryPathElements = {
    directories: IPathElement[];
    files: IPathElement[];
    symbolicLinks: IPathElement[];
  };
  ```
  <br/>
</details>





<br/>

## Built With

- TypeScript
- `node:fs/promises`




<br/>

## Running the Tests

```bash
# unit and integration tests
npm run test

# tests, type checking, linting and formatting
npm run verify

# unit tests
npm run test:unit

# integration tests
npm run test:integration
```





<br/>

## License

[MIT](https://choosealicense.com/licenses/mit/)

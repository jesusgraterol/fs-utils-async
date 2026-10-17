import type { ISortDirection } from 'web-utils-kit';

/**
 * Path Element
 * The most relevant information regarding a path element, extracted by making use of the lstat
 * function.
 */
export type IPathElement = {
  // the path of the element, as provided
  path: string;

  // the base name of the element
  baseName: string;

  // the extension of the element (e.g '.json'), or an empty string when it has none
  extName: string;

  // true if the element is a file
  isFile: boolean;

  // true if the element is a directory
  isDirectory: boolean;

  // true if the element is a symbolic link, in which case isFile and isDirectory are false
  isSymbolicLink: boolean;

  // the size of the element in bytes
  size: number;

  // the time the element was created, in milliseconds
  creation: number;
};

// the keys the elements of a directory can be sorted by
export type IDirectoryElementsKeySort = 'baseName' | 'size' | 'creation';

/**
 * Directory Elements Options
 * When querying the path elements from within a directory, a series of filters and sorting options
 * can be provided.
 */
export type IDirectoryElementsOptions = {
  // the key that will be used to sort the elements. Defaults to 'baseName'
  sortByKey: IDirectoryElementsKeySort;

  // the sort order that will be applied to the elements. Defaults to 'asc'
  sortOrder: ISortDirection;

  // the list of file extensions that will be included. Defaults to [] (includes all exts)
  includeExts: string[];
};

// the elements of a directory, grouped by kind
export type IDirectoryPathElements = {
  directories: IPathElement[];
  files: IPathElement[];
  symbolicLinks: IPathElement[];
};

// the readFile options that make it return a string
export type IReadStringFileOptions =
  | {
      encoding: BufferEncoding;
      flag?: string | undefined;
    }
  | BufferEncoding;

// the readFile options that make it return a Buffer
export type IReadBufferFileOptions = {
  encoding?: null | undefined;
  flag?: string | undefined;
} | null;

// the options accepted by readFile
export type IReadFileOptions = IReadBufferFileOptions | IReadStringFileOptions;

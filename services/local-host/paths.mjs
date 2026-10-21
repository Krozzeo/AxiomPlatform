import {lstat, realpath} from 'node:fs/promises';
import {resolve, relative, isAbsolute, sep} from 'node:path';
import {assert} from '../../packages/contracts/index.mjs';

export function inside(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep));
}
export async function authorizedPath(root, value, {directory = false} = {}) {
  assert(typeof value === 'string' && value.length > 0 && value.length < 2048, 'invalidRequest','Enter a project path.');
  const target = resolve(root, value);
  assert(inside(root, target), 'permissionDenied','The path is outside the authorized project root.');
  const canonicalRoot = await realpath(root);
  const real = await realpath(target);
  assert(inside(canonicalRoot, real), 'permissionDenied','The project path escapes its authorized root.');
  const info = await lstat(target);
  assert(!info.isSymbolicLink() && (directory ? info.isDirectory() : info.isFile() && info.nlink === 1), 'permissionDenied','Choose an ordinary local project file or directory.');
  return real;
}

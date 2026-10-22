export const PLATFORM_VERSION = '0.1.6';
export const PROTOCOL_VERSION = 1;
export const CAPABILITIES = ['project.detect','project.create','project.open','project.status','project.save','project.close'];
export const METHODS = ['initialize', ...CAPABILITIES];
export const CODES = ['incompatibleVersion','unsupportedCapability','permissionDenied','projectBusy','revisionConflict','cancelled','operationFailed','invalidRequest','resultUnknown'];
export function failure(code, message) {
  return Object.assign(new Error(message), {code: CODES.includes(code) ? code : 'operationFailed'});
}
export function assert(condition, code, message) { if (!condition) throw failure(code, message); }
export function validateManifest(value) {
  assert(value && value.manifestVersion === 1 && value.protocolVersion === PROTOCOL_VERSION, 'incompatibleVersion', 'Unsupported product manifest or protocol version.');
  assert(/^axiom\.[a-z][a-z0-9.-]{0,63}$/.test(value.productId) && typeof value.displayName === 'string' && value.displayName.length <= 100, 'invalidRequest', 'Invalid product identity.');
  assert(/^\d+\.\d+\.\d+$/.test(value.productVersion) && value.platformApiRange === '>=0.1.0 <0.2.0', 'incompatibleVersion', 'This host requires a product compatible with Platform API 0.1.');
  assert(Array.isArray(value.capabilities) && CAPABILITIES.every(c => value.capabilities.includes(c)), 'unsupportedCapability', 'Product does not implement the P1 project lifecycle.');
  assert(Array.isArray(value.projectFormats) && value.projectFormats.length > 0 && value.projectFormats.every(f => typeof f.id === 'string' && Array.isArray(f.versions) && f.versions.every(Number.isSafeInteger)), 'invalidRequest', 'Invalid product format declaration.');
  assert(value.launch?.adapter === 'official-local' && typeof value.launch.entry === 'string' && value.launch.entry.endsWith('.mjs'), 'invalidRequest', 'A registered local adapter is required.');
  return structuredClone(value);
}

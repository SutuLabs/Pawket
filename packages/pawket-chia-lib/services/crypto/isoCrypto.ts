export default
  globalThis.crypto ||
  (typeof process === 'object' && typeof require === 'function' ? require('node:crypto').webcrypto : undefined);

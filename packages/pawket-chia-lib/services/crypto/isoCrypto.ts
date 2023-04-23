/* eslint-disable @typescript-eslint/no-var-requires */
let nwp = require;
if (typeof __non_webpack_require__ !== "undefined") nwp = __non_webpack_require__;
export default
  globalThis.crypto ||
  (nwp('node:crypto')).webcrypto
  ;
// utilize $tc to workaround vue-i18n-extract cannot recognize `callback(tc('key'))`
import { tc as $tc } from "@/i18n/i18n";

export async function initCameraHandleError(
  promise: Promise<void>,
  errorCallback: (err: string) => Promise<void>
): Promise<void> {
  try {
    await promise;
  } catch (error) {
    if (!(error instanceof Error)) {
      console.warn("camera error: ", typeof error, error);
      return;
    }
    if (error.name === "NotAllowedError") {
      await errorCallback($tc("scanQrCode.message.error.NotAllowedError"));
    } else if (error.name === "NotFoundError") {
      await errorCallback($tc("scanQrCode.message.error.NotFoundError"));
    } else if (error.name === "NotSupportedError") {
      await errorCallback($tc("scanQrCode.message.error.NotSupportedError"));
    } else if (error.name === "NotReadableError") {
      await errorCallback($tc("scanQrCode.message.error.NotReadableError"));
    } else if (error.name === "OverconstrainedError") {
      await errorCallback($tc("scanQrCode.message.error.OverconstrainedError"));
    } else if (error.name === "StreamApiNotSupportedError") {
      await errorCallback($tc("scanQrCode.message.error.StreamApiNotSupportedError"));
    } else if (error.name === "InsecureContextError") {
      await errorCallback($tc("scanQrCode.message.error.InsecureContextError"));
    } else {
      await errorCallback(`ERROR: Camera error (${error.name})`);
    }
  }
}

export function decodeAddress(prefix: string, qrcode: string): string | null {
  const p = prefix;
  //eslint-disable-next-line
  const reg = new RegExp(`${p}1[0-9a-z]{58}`);
  const r = qrcode.match(reg);
  if (!r) return null;
  return r[0];
}

// test cases:
// console.log(decodeAddress("xch", "xch1u6dmdmzzu8aapmmax03et0u7secnwlgywcvzg05xdqkwqamlqkxstnhvcp"));
// console.log(decodeAddress("txch", "txch1756uj7eypj9ehmd2923nx5tv6egsyctzw4un4lz734x83gnm759q6lu024"));
// console.log(decodeAddress("xch", "https://www.spacescan.io/xch/xch19tq8q0tkm2660mfpjqv9y94j7fcdfpx860a9ymskeulafk9d653qu8wkyk"));

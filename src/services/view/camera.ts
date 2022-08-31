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
  const reg = new RegExp("/([^/]*)$");
  const r = qrcode.match(reg);
  if (!r || r.length != 2) return null;
  const rr = r[1];
  if (rr.startsWith(p)) {
    return rr;
  }

  return null;
}
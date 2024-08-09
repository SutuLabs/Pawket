export function isIos(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((<any>window).cordova && (<any>window).cordova.platformId == "ios") return true;
  return false;
}

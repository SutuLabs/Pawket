export function nameOmit(name: string, ellipsis = "...", length = 10): string {
  let nameRes = "";
  if (!name) return nameRes;
  if (name.length <= length + ellipsis.length) {
    nameRes = name;
  } else {
    nameRes = name.slice(0, length) + ellipsis;
  }
  return nameRes.toUpperCase();
}

export default { nameOmit };

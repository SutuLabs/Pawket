export function nameOmit(name: string, ellipsis = "...", length = 10): string {
  if (!name) return "";
  if (name.length <= length + ellipsis.length) return name;
  return name.slice(0, length) + ellipsis;
}

export default { nameOmit };

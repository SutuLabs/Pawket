export function shorten(address: string, ellipsis = "...", offset = 0, head = 7, tail = 4): string {
  if (!address) return "";
  if (address.length <= offset + head + tail + ellipsis.length) return address;
  return address.slice(offset, head) + ellipsis + address.slice(-tail);
}

export default { shorten };
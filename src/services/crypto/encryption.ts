import utility from "./utility";

class EncryptionHelper {

  public async encrypt(data: string, key: string): Promise<string> {
    const enc = new TextEncoder();
    const impkey = await window.crypto.subtle.importKey(
      "raw",
      await utility.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const part1 = utility.toHexString(iv);
    const part2 = utility.toHexString(
      new Uint8Array(
        await crypto.subtle.encrypt(
          {
            name: "AES-CBC",
            iv,
          },
          impkey,
          enc.encode(data)
        )
      )
    );
    return part1 + part2;
  }

  public async decrypt(encdata: string, key: string): Promise<string> {
    const dec = new TextDecoder();
    const arr = utility.fromHexString(encdata);
    if (arr.length < 16) return "";
    const iv = arr.subarray(0, 16);
    const impkey = await window.crypto.subtle.importKey(
      "raw",
      await utility.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    return dec.decode(
      new Uint8Array(
        await crypto.subtle.decrypt(
          {
            name: "AES-CBC",
            iv,
          },
          impkey,
          arr.subarray(16)
        )
      )
    );
  }
}

export default new EncryptionHelper();

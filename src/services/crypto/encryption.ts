import utility from "./utility";
import { ec as EC } from 'elliptic';
import isoCrypto from "./isoCrypto";

class EncryptionHelper {

  public async encrypt(data: string, key: string, random: Uint8Array | undefined = undefined): Promise<string> {
    const enc = new TextEncoder();
    const impkey = await isoCrypto.subtle.importKey(
      "raw",
      await utility.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    const iv = (random && random.length == 16) ? random : isoCrypto.getRandomValues(new Uint8Array(16));
    const part1 = utility.toHexString(iv);
    const part2 = utility.toHexString(
      new Uint8Array(
        await isoCrypto.subtle.encrypt(
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
    const impkey = await isoCrypto.subtle.importKey(
      "raw",
      await utility.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    return dec.decode(
      new Uint8Array(
        await isoCrypto.subtle.decrypt(
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

export class ByteBase {
  constructor(a: ArrayLike<number>) {
    this.data = new Uint8Array(a);
  }

  public data: Uint8Array;

  public toHex(): string {
    return ByteBase.toHexString(this.data);
  }

  public static toHexString(byteArray: Uint8Array): string {
    return Array.from(byteArray, (byte) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

  public static hexStringToByte(str: string): Uint8Array {
    if (!str) {
      return new Uint8Array(0);
    }

    const a = [];
    for (let i = 0, len = str.length; i < len; i += 2) {
      a.push(parseInt(str.substr(i, 2), 16));
    }

    return new Uint8Array(a);
  }
}

export class EcPrivateKey extends ByteBase {
  private static size = 32;

  constructor(a: ArrayLike<number>) {
    super(a);
  }

  private static parseInternal(hex: string): EcPrivateKey {
    return new EcPrivateKey(this.hexStringToByte(hex));
  }

  public static parse(hex: string): EcPrivateKey | null {
    try {
      const a = this.parseInternal(hex);
      if (a.data.length != this.size) return null;
      return a;
    }
    catch (err) {
      console.error("parse error", err);
      return null;
    }
  }
}

export class EcPublicKey extends ByteBase {
  private static size = 32;

  constructor(a: ArrayLike<number>) {
    super(a);
  }

  private static parseInternal(hex: string): EcPublicKey {
    return new EcPublicKey(this.hexStringToByte(hex));
  }

  public static parse(hex: string): EcPublicKey | null {
    try {
      const a = this.parseInternal(hex);
      if (a.data.length != this.size) return null;
      return a;
    }
    catch (err) {
      console.error("parse error", err);
      return null;
    }
  }
}

export class CryptographyService {

  private ec: EC;
  private size = 32;
  private subtle: SubtleCrypto;

  constructor(curve = "curve25519") {
    this.ec = new EC(curve);
    this.subtle = isoCrypto.subtle;
  }

  public get canDecrypt(): boolean {
    return !!this.subtle;
  }

  public async decrypt(encrypted: string, pubKey2: string | EcPublicKey, privKey1: string | EcPrivateKey): Promise<string> {
    const pk2 = typeof pubKey2 === "string" ? EcPublicKey.parse(pubKey2) : pubKey2;
    const sk1 = typeof privKey1 === "string" ? EcPrivateKey.parse(privKey1) : privKey1;
    if (!pk2 || !sk1) throw new Error("malformat pk2 or sk1");
    const sharedkey = this.getSharedKey(pk2, sk1);

    return await (new EncryptionHelper()).decrypt(encrypted, ByteBase.toHexString(sharedkey));
  }

  public async encrypt(plaintext: string, pubKey2: string | EcPublicKey, privKey1: string | EcPrivateKey,
    random: Uint8Array | undefined = undefined): Promise<string> {
    const pk2 = typeof pubKey2 === "string" ? EcPublicKey.parse(pubKey2) : pubKey2;
    const sk1 = typeof privKey1 === "string" ? EcPrivateKey.parse(privKey1) : privKey1;
    if (!pk2 || !sk1) throw new Error("malformat pk2 or sk1");
    const sharedkey = this.getSharedKey(pk2, sk1);

    return await (new EncryptionHelper()).encrypt(plaintext, ByteBase.toHexString(sharedkey), random);
  }

  public getPublicKey(privateKey: string | EcPrivateKey): EcPublicKey {
    const sk = typeof privateKey === "string" ? privateKey : privateKey.data;
    const key = this.ec.keyFromPrivate(sk);
    return new EcPublicKey(key.getPublic(true, "array"));
  }

  public getSharedKey(pubKey: EcPublicKey, privKey: EcPrivateKey): Uint8Array {
    const key1 = this.ec.keyFromPrivate(privKey.data);
    const key2 = this.ec.keyFromPublic(pubKey.data);
    const shared = key1.derive(key2.getPublic());
    return Uint8Array.from(shared.toArray());
  }
}

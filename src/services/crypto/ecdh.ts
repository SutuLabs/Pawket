import { AccountEntity } from "@/models/account";
import { PointG1, utils } from "@noble/bls12-381";
import { Bytes, bigint_from_bytes } from "clvm";
import { sexpAssemble } from "../coin/analyzer";
import { Hex0x, prefix0x } from "../coin/condition";
import { DEFAULT_HIDDEN_PUZZLE_HASH, GROUP_ORDER } from "../coin/consts";
import { findByPath } from "../coin/lisp";
import encryption from "./encryption";
import { PuzzleDetail } from "./puzzle";
import receive from "./receive";
import { bigint_to_uint8array_padding, calculate_synthetic_offset } from "./sign";

export class EcdhHelper {

  public async encrypt(self: Hex0x, to: Hex0x, plain: string, account: AccountEntity, rpcUrl: string,
    random: Uint8Array | undefined = undefined
  ): Promise<string> {
    const synsk_self = this.addressToSynSk(self, account);
    const synpk_to: PointG1 = await this.addressToSynPk(to, rpcUrl);

    const sharedKey = synpk_to.multiplyPrecomputed(this.bytesToNumberBE(synsk_self)).toHex();
    const encrypted = await encryption.encrypt(plain, sharedKey, random)
    return encrypted;
  }

  public async decrypt(from: Hex0x, self: Hex0x, encrypted: string, account: AccountEntity, rpcUrl: string): Promise<string> {
    const synsk_self = this.addressToSynSk(self, account);
    const synpk_from: PointG1 = await this.addressToSynPk(from, rpcUrl);

    const sharedKey = synpk_from.multiplyPrecomputed(this.bytesToNumberBE(synsk_self)).toHex();
    const plain = await encryption.decrypt(encrypted, sharedKey)
    return plain;
  }

  // address(puzzle hash) -> spent coin -> uncurry -> synpk
  public async addressToSynPk(puzzleHash: Hex0x, rpcUrl: string): Promise<PointG1> {
    const puz = await receive.getSpentCoinPuzzle(puzzleHash, rpcUrl);
    if (!puz) throw new Error("cannot get puzzle from coin");
    const prog = sexpAssemble(puz);
    const synpk = findByPath(prog, "rrfrfr").as_bin().hex().slice(2);
    return PointG1.fromHex(synpk);
  }

  // address(puzzle hash) -> sk -> synsk
  public addressToSynSk(puzzleHash: Hex0x, account: AccountEntity): Uint8Array {
    const all = account.addressPuzzles.reduce((acc, token) => acc.concat(token.puzzles), [] as PuzzleDetail[]);
    const found = all.filter(_ => prefix0x(_.hash) == puzzleHash).at(0);
    if (!found) throw new Error(`Cannot find the address [${puzzleHash}] from [${all.map(_ => _.hash).join(", ")}] to generate synsk`);
    const sk = found.privateKey.serialize();
    return this.calculate_synthetic_secret_key(sk, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  }

  private bytesToNumberBE(bytes: Uint8Array): bigint {
    return BigInt("0x" + utils.bytesToHex(bytes));
  }

  calculate_synthetic_secret_key(secret_key: Uint8Array, hidden_puzzle_hash: Uint8Array): Uint8Array {
    const secret_exponent = bigint_from_bytes(Bytes.from(secret_key), { signed: true });
    const public_key = PointG1.fromPrivateKey(secret_key);
    const synthetic_offset = calculate_synthetic_offset(public_key.toRawBytes(true), hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % GROUP_ORDER;
    const synthetic_secret_key = bigint_to_uint8array_padding(synthetic_secret_exponent);
    return synthetic_secret_key;
  }
}

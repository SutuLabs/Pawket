import * as clvm_tools from "clvm_tools/browser";
import { bech32m } from "@scure/base";
import store from "../../store";
import { Bytes } from "clvm";
import { PrivateKey } from "@chiamine/bls-signatures";
import utility from "./utility";

export interface PuzzleDetail {
  privateKey: PrivateKey;
  puzzle: string;
  hash: string;
  address: string;
}

class PuzzleMaker {

  public getPuzzle(synPubkey: string): string {
    const puzzle = `(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1))`;
    return puzzle;
  }

  public async getSyntheticKey(pubkey: string): Promise<string> {
    if (!pubkey.startsWith("0x")) pubkey = "0x" + pubkey;
    await store.dispatch("initializeClvm");
    const hidden_puzzle_hash = "0x711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699";

    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go(
      "brun",
      "(point_add 2 (pubkey_for_exp (sha256 2 5)))",
      `(${pubkey} ${hidden_puzzle_hash})`
    );
    const synPubkey = output[0];

    return synPubkey;
  }

  public async getPuzzleHash(pubkey: string): Promise<string> {
    const synPubkey = await this.getSyntheticKey(pubkey);
    const puzzle = this.getPuzzle(synPubkey);
    return await this.getPuzzleHashFromPuzzle(puzzle);
  }

  public async getPuzzleHashFromPuzzle(puzzle: string): Promise<string> {
    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opc", "-H", puzzle);
    const puzzleHash = output[0];
    // console.log("puzzleHash", puzzleHash);

    return puzzleHash;
  }

  public async encodePuzzle(puzzle: string): Promise<string> {
    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opc", puzzle);
    const encodedPuzzle = output[0];

    return encodedPuzzle;
  }

  public getCatPuzzle(synPubkey: string, assetId: string): string {
    if (!synPubkey.startsWith("0x")) synPubkey = "0x" + synPubkey;
    if (!assetId.startsWith("0x")) assetId = "0x" + assetId;

    const catClvmTreehash = "0x72dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdc";
    const puzzle = `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1)) 1))))`;

    return puzzle;
  }

  public async getCatPuzzleHash(pubkey: string, assetId: string): Promise<string> {
    const synPubkey = await this.getSyntheticKey(pubkey);
    const puzzle = this.getCatPuzzle(synPubkey, assetId);

    return await this.getPuzzleHashFromPuzzle(puzzle);
  }

  public async getAddress(pubkey: string, prefix: string): Promise<string> {
    const puzzleHash = await this.getPuzzleHash(pubkey);

    const address = bech32m.encode(prefix, bech32m.toWords(utility.fromHexString(puzzleHash)));
    // console.log(address);
    return address;
  }

  public async getAddressesFromPuzzleHash(puzzleHashes: string[], prefix: string): Promise<string[]> {
    const arr = [];
    for (let i = 0; i < puzzleHashes.length; i++) {
      const h = puzzleHashes[i];
      arr.push(await this.getAddressFromPuzzleHash(h, prefix));
    }

    return arr;
  }

  public getAddressFromPuzzleHash(puzzleHash: string, prefix: string): string {
    const address = bech32m.encode(prefix, bech32m.toWords(utility.fromHexString(puzzleHash)));
    return address;
  }

  public getPuzzleHashFromAddress(address: string): string {
    const hex = Bytes.from(bech32m.decodeToBytes(address).bytes).hex();
    if (hex.length == 66 && hex[0] == "0" && hex[1] == "0") return hex.substr(2);
    return hex;
  }

  public async getPuzzleHashes(privateKey: Uint8Array, startIndex = 0, endIndex = 10): Promise<string[]> {
    return (await this.getPuzzleDetails(privateKey, startIndex, endIndex)).map(_ => _.hash);
  }

  public async getPuzzleDetails(privateKey: Uint8Array, startIndex = 0, endIndex = 10): Promise<PuzzleDetail[]> {
    return await this.getPuzzleDetailsInner(privateKey, async (spk) => this.getPuzzle(spk), startIndex, endIndex)
  }

  public async getCatPuzzleDetails(privateKey: Uint8Array, assetId: string, startIndex = 0, endIndex = 10): Promise<PuzzleDetail[]> {
    return await this.getPuzzleDetailsInner(privateKey, async (spk) => this.getCatPuzzle(spk, assetId), startIndex, endIndex)
  }

  private async getPuzzleDetailsInner(
    privateKey: Uint8Array,
    getPuzzle: (pubkey: string) => Promise<string>,
    startIndex: number,
    endIndex: number,
    prefix = "xch"): Promise<PuzzleDetail[]> {
    const derive = await utility.derive(privateKey);
    const details: PuzzleDetail[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      const privkey = derive([12381, 8444, 2, i]);
      const pubkey = utility.toHexString(privkey.get_g1().serialize());
      const synpubkey = await this.getSyntheticKey(pubkey);
      const puzzle = await getPuzzle(synpubkey);
      const hash = await this.getPuzzleHashFromPuzzle(puzzle);
      const address = this.getAddressFromPuzzleHash(hash, prefix);
      details.push({ privateKey: privkey, hash, address, puzzle });
    }

    return details;
  }

  public async getCatPuzzleHashes(privateKey: Uint8Array, assetId: string, startIndex = 0, endIndex = 10): Promise<string[]> {
    return (await this.getCatPuzzleDetails(privateKey, assetId, startIndex, endIndex)).map(_ => _.hash);
  }
}

export default new PuzzleMaker();

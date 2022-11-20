import * as clvm_tools from "clvm_tools";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import { PrivateKey, G1Element } from "@chiamine/bls-signatures";
import utility from "./utility";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import { Instance } from "../util/instance";
import { modsdict } from "../coin/mods";
import { Hex0x, prefix0x, unprefix0x } from "../coin/condition";
import { SExp, TToJavascript } from "clvm";
import { sexpAssemble } from "../coin/analyzer";

export interface ExecuteResultCondition {
  op: number;
  args: string[];
}

export interface ExecuteResult {
  raw: string;
  conditions: ConditionEntity[];
  sexp: SExp;
}

export type PlaintextPuzzle = string;

export type AddressType = "Observed" | "Hardened" | "Unknown";

export interface PuzzlePrivateKey extends PuzzleAddress {
  privateKey: PrivateKey;
  synPubKey: Hex0x;
}

export interface PuzzleDetail extends PuzzleObserver {
  privateKey: PrivateKey;
}

export interface PuzzleObserver extends PuzzleAddress {
  puzzle: PlaintextPuzzle;
  synPubKey: Hex0x;
}

export interface PuzzleAddress {
  hash: string;
  address: string;
  type?: AddressType;
}

export type ConditionArgs = (Uint8Array | undefined | ConditionArgs[]);

export interface ConditionEntity {
  code: number;
  args: ConditionArgs[];
}

export const catClvmTreehash_v1 = "0x72dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdc";
export const catClvmTreehash_v2 = "0x37bef360ee858133b69d595a906dc45d01af50379dad515eb9518abb7c1d2a7a";

class PuzzleMaker {

  public getPuzzle(synPubkey: string): string {
    const puzzle = `(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1))`;
    return puzzle;
  }

  public async getSyntheticKey(pubkey: string): Promise<string> {
    if (!pubkey.startsWith("0x")) pubkey = "0x" + pubkey;
    const hidden_puzzle_hash = "0x711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699";

    let output: string[] = [];
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

  public async getPuzzleHashFromSyntheticKey(synPubkey: string): Promise<string> {
    const puzzle = this.getPuzzle(synPubkey);
    return await this.getPuzzleHashFromPuzzle(puzzle);
  }

  public async getPuzzleHashFromPuzzle(puzzle: string): Promise<string> {
    let output: string[] = [];
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opc", "-H", puzzle);
    const puzzleHash = output[0];

    return puzzleHash;
  }

  public async encodePuzzle(puzzle: string): Promise<string> {
    let output: string[] = [];
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opc", puzzle);
    const encodedPuzzle = output[0];

    return encodedPuzzle;
  }

  public async disassemblePuzzle(puzzle_hex: string): Promise<string> {
    puzzle_hex = unprefix0x(puzzle_hex);
    let output: string[] = [];
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("opd", puzzle_hex);
    const puzzle = output[0];

    return puzzle;
  }

  public getCatPuzzle(synPubkey: string, assetId: string, catModName: "cat_v1" | "cat_v2"): string {
    if (!synPubkey.startsWith("0x")) synPubkey = "0x" + synPubkey;
    if (!assetId.startsWith("0x")) assetId = "0x" + assetId;
    const catClvmTreehash = catModName == "cat_v1" ? catClvmTreehash_v1 : catClvmTreehash_v2;

    const puzzle = catModName == "cat_v1"
      ? `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1)) 1))))`
      : `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 52 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (a 42 (c 2 (c 639 (c 1407 (c 2943 ()))))) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((61 . 70) 2 51 . 60) (c . 1) 1 -53 . 2) ((not 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 124 (sha256 52 36) (sha256 124 (sha256 124 (sha256 52 44) 9) (sha256 124 11 (sha256 52 ())))) ())))) (q . 11)) 1) (a (i (all (= (strlen 5) 34) (= (strlen 11) 34) (> 23 (q . -1))) (q 11 5 11 23) (q 8)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 86 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) 4 (c 5 39) (c (+ 11 87) 119)) ((a (i 5 (q 2 (i (= (a (i (= 17 88) (q . 89) ()) 1) (q . -113)) (q 2 38 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 122 (c 2 (c (a (i (= 17 88) (q 4 88 (c (a 118 (c 2 (c 19 (c 41 (c (sha256 52 91) (c 43 ())))))) 57)) (q 2 (i (= 17 120) (q 2 (i (not (a (i (= (q . 33) (strlen 41)) (q 2 (i (= (substr 41 () 52) 92) (q 1 . 1) ()) 1) ()) 1)) (q . 9) (q 8)) 1) (q . 9)) 1)) 1) (c (a (i (= 17 88) (q . 89) ()) 1) (c (a 38 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) (a (i 5 (q 4 9 (a 86 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 124 (sha256 52 40) (sha256 124 (sha256 124 (sha256 52 44) 5) (sha256 124 (a 50 (c 2 (c 7 (c (sha256 52 52) ())))) (sha256 52 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) (c (c 48 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 38 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (a 42 (c 2 (c 1279 (c (a 118 (c 2 (c 9 (c 2815 (c (sha256 52 45) (c 21 ())))))) (c 5887 ()))))) (c 1535 (c 3071 ()))))))))))) 2 90 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (a 42 (c 2 (c 39 (c (a 118 (c 2 (c 41 (c 87 (c (sha256 52 -71) (c 89 ())))))) (c -73 ())))))) ()) 1) (c 23 (c 5 (c 767 (c (c (c 120 (c (concat 92 (a 46 (c 2 (c (c 47 (c 383 ())) ())))) ())) (c (c 32 (c (sha256 -65 92 (a 46 (c 2 (c (c 21 (c (+ 383 (- 735 43) 767) ())) ())))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1)) 1))))`;

    return puzzle;
  }

  public async getCatPuzzleHash(pubkey: string, assetId: string, catModName: "cat_v1" | "cat_v2"): Promise<string> {
    const synPubkey = await this.getSyntheticKey(pubkey);
    const puzzle = this.getCatPuzzle(synPubkey, assetId, catModName);

    return await this.getPuzzleHashFromPuzzle(puzzle);
  }

  public getCatSettlementPuzzle(assetId: string, catModName: "cat_v1" | "cat_v2"): string {
    if (!assetId.startsWith("0x")) assetId = "0x" + assetId;
    const catClvmTreehash = catModName == "cat_v1" ? catClvmTreehash_v1 : catClvmTreehash_v2;
    return catModName == "cat_v1"
      ? `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) 1))))`
      : `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 52 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (a 42 (c 2 (c 639 (c 1407 (c 2943 ()))))) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((61 . 70) 2 51 . 60) (c . 1) 1 -53 . 2) ((not 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 124 (sha256 52 36) (sha256 124 (sha256 124 (sha256 52 44) 9) (sha256 124 11 (sha256 52 ())))) ())))) (q . 11)) 1) (a (i (all (= (strlen 5) 34) (= (strlen 11) 34) (> 23 (q . -1))) (q 11 5 11 23) (q 8)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 86 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) 4 (c 5 39) (c (+ 11 87) 119)) ((a (i 5 (q 2 (i (= (a (i (= 17 88) (q . 89) ()) 1) (q . -113)) (q 2 38 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 122 (c 2 (c (a (i (= 17 88) (q 4 88 (c (a 118 (c 2 (c 19 (c 41 (c (sha256 52 91) (c 43 ())))))) 57)) (q 2 (i (= 17 120) (q 2 (i (not (a (i (= (q . 33) (strlen 41)) (q 2 (i (= (substr 41 () 52) 92) (q 1 . 1) ()) 1) ()) 1)) (q . 9) (q 8)) 1) (q . 9)) 1)) 1) (c (a (i (= 17 88) (q . 89) ()) 1) (c (a 38 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) (a (i 5 (q 4 9 (a 86 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 124 (sha256 52 40) (sha256 124 (sha256 124 (sha256 52 44) 5) (sha256 124 (a 50 (c 2 (c 7 (c (sha256 52 52) ())))) (sha256 52 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) (c (c 48 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 38 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (a 42 (c 2 (c 1279 (c (a 118 (c 2 (c 9 (c 2815 (c (sha256 52 45) (c 21 ())))))) (c 5887 ()))))) (c 1535 (c 3071 ()))))))))))) 2 90 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (a 42 (c 2 (c 39 (c (a 118 (c 2 (c 41 (c 87 (c (sha256 52 -71) (c 89 ())))))) (c -73 ())))))) ()) 1) (c 23 (c 5 (c 767 (c (c (c 120 (c (concat 92 (a 46 (c 2 (c (c 47 (c 383 ())) ())))) ())) (c (c 32 (c (sha256 -65 92 (a 46 (c 2 (c (c 21 (c (+ 383 (- 735 43) 767) ())) ())))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) 1))))`;
  }

  public async getAddress(pubkey: string, prefix: string): Promise<string> {
    const puzzleHash = await this.getPuzzleHash(pubkey);

    const address = bech32m.encode(prefix, bech32m.toWords(utility.fromHexString(puzzleHash)));
    // console.log(address);
    return address;
  }

  public getAddressesFromPuzzleHash(puzzleHashes: string[], prefix: string): string[] {
    const arr = [];
    for (let i = 0; i < puzzleHashes.length; i++) {
      const h = puzzleHashes[i];
      arr.push(this.getAddressFromPuzzleHash(h, prefix));
    }

    return arr;
  }

  public getAddressFromPuzzleHash(puzzleHash: Hex0x | string, prefix: string): string {
    const address = bech32m.encode(prefix, bech32m.toWords(utility.fromHexString(unprefix0x(puzzleHash))));
    return address;
  }

  public getPuzzleHashFromAddress(address: string): string {
    const hex = Bytes.from(bech32m.decodeToBytes(address).bytes).hex();
    if (hex.length == 66 && hex[0] == "0" && hex[1] == "0") return hex.substr(2);
    return hex;
  }

  public async getPuzzleHashes(privateKey: Uint8Array, prefix: string, startIndex = 0, endIndex = 10): Promise<string[]> {
    return (await this.getPuzzleDetails(privateKey, prefix, startIndex, endIndex)).map(_ => _.hash);
  }

  public async getPuzzleDetails(privateKey: string | Uint8Array, prefix: string, startIndex = 0, endIndex = 10): Promise<PuzzleDetail[]> {
    if (typeof privateKey === "string") privateKey = utility.fromHexString(privateKey);
    return await this.getPuzzleDetailsInner(privateKey, async (spk) => this.getPuzzle(spk), startIndex, endIndex, prefix, true)
  }

  public async getCatPuzzleDetails(privateKey: Uint8Array, assetId: string, prefix: string, startIndex = 0, endIndex = 10, catModName: "cat_v1" | "cat_v2"): Promise<PuzzleDetail[]> {
    return await this.getPuzzleDetailsInner(privateKey, async (spk) => this.getCatPuzzle(spk, assetId, catModName), startIndex, endIndex, prefix, true)
  }

  public getObserverPuzzles(details: PuzzleDetail[]): PuzzleObserver[] {
    return details.map(_ => ({
      hash: _.hash,
      address: _.address,
      type: _.type,
      puzzle: _.puzzle,
      synPubKey: _.synPubKey,
    }));
  }

  private async getPuzzleDetailsInner(
    privateKey: Uint8Array,
    getPuzzle: (pubkey: string) => Promise<string>,
    startIndex: number,
    endIndex: number,
    prefix: string,
    includeUnhardened = false): Promise<PuzzleDetail[]> {
    const derive = await utility.derive(privateKey, true);
    const deriveUnhardened = await utility.derive(privateKey, false);
    const details: PuzzleDetail[] = [];
    const add = async (privkey: PrivateKey, hardened: boolean) => {
      const pubkey = utility.toHexString(privkey.get_g1().serialize());
      const synpubkey = await this.getSyntheticKey(pubkey);
      const puzzle = await getPuzzle(synpubkey);
      const hash = await this.getPuzzleHashFromPuzzle(puzzle);
      const address = this.getAddressFromPuzzleHash(hash, prefix);
      details.push({
        privateKey: privkey,
        synPubKey: prefix0x(synpubkey),
        hash: hash,
        puzzle: puzzle,
        address,
        type: hardened ? "Hardened" : "Observed"
      });
    }
    for (let i = startIndex; i < endIndex; i++) {
      const privkey = derive([12381, 8444, 2, i]);
      await add(privkey, true);
      if (includeUnhardened) {
        const privkey = deriveUnhardened([12381, 8444, 2, i]);
        await add(privkey, false);
      }
    }

    return details;
  }

  public async getPuzzleObservers(pubKey: string | Uint8Array, prefix: string, startIndex = 0, endIndex = 10): Promise<PuzzleObserver[]> {
    if (typeof pubKey === "string") pubKey = utility.fromHexString(pubKey);
    return await this.getPuzzleObserversInner(pubKey, async (spk) => this.getPuzzle(spk), startIndex, endIndex, prefix)
  }

  public async getCatPuzzleObservers(
    pubKey: Uint8Array, assetId: string, prefix: string, startIndex = 0, endIndex = 10, catModName: "cat_v1" | "cat_v2"
  ): Promise<PuzzleObserver[]> {
    return await this.getPuzzleObserversInner(pubKey, async (spk) => this.getCatPuzzle(spk, assetId, catModName), startIndex, endIndex, prefix)
  }

  private async getPuzzleObserversInner(
    publicKey: Uint8Array,
    getPuzzle: (pubkey: string) => Promise<string>,
    startIndex: number,
    endIndex: number,
    prefix: string): Promise<PuzzleObserver[]> {
    const derive = await utility.derivePk(publicKey);
    const details: PuzzleObserver[] = [];
    const add = async (pk: G1Element) => {
      const pubkey = utility.toHexString(pk.serialize());
      const synpubkey = await this.getSyntheticKey(pubkey);
      const puzzle = await getPuzzle(synpubkey);
      const hash = await this.getPuzzleHashFromPuzzle(puzzle);
      const address = this.getAddressFromPuzzleHash(hash, prefix);
      details.push({
        synPubKey: prefix0x(synpubkey),
        hash: hash,
        puzzle: puzzle,
        address,
        type: "Observed"
      });
    }
    for (let i = startIndex; i < endIndex; i++) {
      const pk = derive([12381, 8444, 2, i]);
      await add(pk);
    }

    return details;
  }

  public getPrivateKeyFromHex(sk_hex: string): PrivateKey {
    const privateKey = utility.fromHexString(sk_hex);
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return sk;
  }

  public async getCatPuzzleHashes(privateKey: Uint8Array, assetId: string, prefix: string, startIndex = 0, endIndex = 10, catModName: "cat_v1" | "cat_v2"): Promise<string[]> {
    return (await this.getCatPuzzleDetails(privateKey, assetId, prefix, startIndex, endIndex, catModName)).map(_ => _.hash);
  }

  public async calcPuzzleResult(puzzle_reveal: string, solution: string, ...args: string[]): Promise<string> {
    let output: string[] = [];
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("brun", puzzle_reveal, solution, "--experiment-backend", "rust", ...args);
    const result = output[0];

    if (result.startsWith("FAIL")) {
      const modname = modsdict[puzzle_reveal];
      throw new Error(`Error calculating puzzle [${modname ? `M'${modname}` : puzzle_reveal.slice(0, 200)}] from solution [${solution.slice(0, 200)}]: ${result.slice(0, 200)}`);
    }

    return result;
  }

  public async compileRun(puzzle_source: string): Promise<string> {
    let output: string[] = [];
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go("run", puzzle_source);
    const result = output[0];

    if (result.startsWith("FAIL")) throw new Error(result);

    return result;
  }

  public parseConditions(conditon: string | SExp): ConditionEntity[] {
    try {
      const program = typeof conditon === "string" ? assemble(conditon) : conditon;
      const prog = program.as_javascript();
      if (!Array.isArray(prog)) return [];
      const conds = prog
        .map<ConditionEntity>((cond: TToJavascript) => ({
          code: (!Array.isArray(cond) ? cond.raw()[0]
            : !Array.isArray(cond[0]) ? cond[0].raw()[0]
              : !Array.isArray(cond[0][0]) ? cond[0][0].raw()[0] : -1),
          args: Array.isArray(cond)
            ? cond.slice(1)
              .map((_: TToJavascript) => Array.isArray(_)
                ? Array.from(_).map((c: TToJavascript) => Array.isArray(c) // utilize Array.from to convert Tuple to Array, otherwise `object is not extensible` error thrown
                  ? Array.isArray(c[0]) ? undefined : c[0].raw()
                  : c.raw())
                : _.raw())
            : [],
        }));

      return conds;
    }
    catch (err) {
      console.warn("failed to parse condition: " + conditon);
      throw err;
    }
  }

  public getEmptyPrivateKey(
  ): PrivateKey {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    return BLS.PrivateKey.from_bytes(new Uint8Array(32), false);
  }

  async executePuzzle(puz: string, solution: string): Promise<ExecuteResult> {
    const solution_result = await this.calcPuzzleResult(puz, solution);

    const conds = assemble(solution_result);
    const solution_results = this.parseConditions(conds);
    return { raw: solution_result, conditions: solution_results, sexp: conds };
  }

  async executePuzzleHex(puz_hex: string, solution_hex: string): Promise<ExecuteResult> {
    const solution_result_hex = await this.calcPuzzleResult(puz_hex, solution_hex, "--hex", "--dump");

    const conds = sexpAssemble(solution_result_hex);
    const solution_results = this.parseConditions(conds);
    return { raw: solution_result_hex, conditions: solution_results, sexp: conds };
  }
}

export default new PuzzleMaker();

/*
| from\to | clvm        | hex             | hash                | sexp         |
| --      | --          | --              | --                  | --           |
| clvm    | -           | opc             | opc -H              | assemble     |
| hex     | opd         | -               | ?                   | sexpAssemble |
| hash    | -           | -               | -                   | -            |
| sexp    | disassemble | .as_bin().hex() | sha256tree(_).hex() | -            |
*/

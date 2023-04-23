import { OriginCoin, SpendBundle } from "@/services/spendbundle";
import { AccountEntity } from "@/models/account";
import { GetParentPuzzleResponse } from "@/models/api";
import receive from "@/services/crypto/receive";
import { curryMod } from "@/services/offer/bundler";
import { modshash, modsprog } from "@/services/coin/mods";
import { Hex0x, prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import { getCoinName0x } from "@/services/coin/coinUtility";

export function assert<T>(expectValue: T, actualValue: T, desc: string | undefined = undefined): void {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const descHint = desc ? " " + desc : "";
  expect(actualValue).toBe(expectValue);
}

export function assertBundle(expect: SpendBundle, actual: SpendBundle): void {
  try {
    assert(expect.aggregated_signature, actual.aggregated_signature);
    assert(expect.coin_spends.length, actual.coin_spends.length);
    for (let i = 0; i < expect.coin_spends.length; i++) {
      assert(expect.coin_spends[i].puzzle_reveal, actual.coin_spends[i].puzzle_reveal);
      assert(expect.coin_spends[i].solution, actual.coin_spends[i].solution);
      assert(expect.coin_spends[i].coin.amount, actual.coin_spends[i].coin.amount);
      assert(expect.coin_spends[i].coin.parent_coin_info, actual.coin_spends[i].coin.parent_coin_info);
      assert(expect.coin_spends[i].coin.puzzle_hash, actual.coin_spends[i].coin.puzzle_hash);
    }
  }
  catch (err) {
    console.warn("expect bundle:", expect);
    console.warn("actual bundle:", actual);
    throw err;
  }
}

export function getTestAccount(privateKey: string): AccountEntity {
  const maxId = 4;
  return {
    addressRetrievalCount: maxId,
    key: {
      privateKey: privateKey,
      fingerprint: 0,
      compatibleMnemonic: "",
    },
    name: "",
    type: "Legacy",
    tokens: {},
    nfts: [],
    dids: [],
    extraInfo: {},
    allCats: [],
    addressPuzzles: [],
    addressGenerated: 0,
  }
}

export async function getTestAccountWithPuzzles(privateKey: string): Promise<AccountEntity> {
  const maxId = 4;
  return {
    addressRetrievalCount: maxId,
    key: {
      privateKey: privateKey,
      fingerprint: 0,
      compatibleMnemonic: "",
    },
    name: "",
    type: "Legacy",
    tokens: {},
    nfts: [],
    dids: [],
    extraInfo: {},
    allCats: [],
    addressPuzzles: await receive.getAssetsRequestDetail(privateKey, 0, maxId, [], {}, "xch", "XCH", "cat_v2"),
    addressGenerated: maxId,
  }
}

export async function noNeedGetProof(): Promise<GetParentPuzzleResponse> {
  throw new Error("unexpected, program declared it does not need proof");
}

export async function logBundle(spendBundle: SpendBundle): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () { return this.toString(); };
  console.log(JSON.stringify(spendBundle));
}

const SpecialParent = "0xba70b644f3cd240ac0c500782d53e633d8c1de21bd554c2ee1e190b24d3c8bb2";
export async function createFakeXchCoin(
  inner_p2_puzzle: string,
  amount = 100000000000000n,// 100 XCH
): Promise<OriginCoin> {
  const puzzle_hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(inner_p2_puzzle));
  return {
    parent_coin_info: SpecialParent,
    amount,
    puzzle_hash,
  };
}

export async function createFakeCatCoin(
  assetId: Hex0x,
  inner_p2_puzzle: string,
  amount = 100000000000000n,// 100 XCH
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<{ cat: OriginCoin, parent: GetParentPuzzleResponse }> {
  const puzzle_reveal = await curryMod(modsprog[catModName], modshash[catModName], assetId, inner_p2_puzzle);
  if (!puzzle_reveal) throw new Error("cannot curry cat");
  const puzzle_reveal_hex = await puzzle.encodePuzzle(puzzle_reveal);
  const puzzle_hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(puzzle_reveal));
  const parentCoin = {
    parent_coin_info: SpecialParent,
    amount,
    puzzle_hash,
  };
  const cat = {
    parent_coin_info: getCoinName0x(parentCoin),
    amount,
    puzzle_hash,
  };

  const parent = {
    parentCoinId: cat.parent_coin_info,
    amount: Number(amount),
    parentParentCoinId: SpecialParent,
    puzzleReveal: prefix0x(puzzle_reveal_hex),
  };
  return { cat, parent }
}
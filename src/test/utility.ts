import { SpendBundle } from "@/models/wallet";
import { AccountEntity } from "@/models/account";
import { GetParentPuzzleResponse } from "@/models/api";

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
  return {
    addressRetrievalCount: 4,
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
    allCats: [],
    addressGenerated: 0,
    addressPuzzles: [],
  }
}

export async function noNeedGetProof(): Promise<GetParentPuzzleResponse> {
  throw new Error("unexpected, program declared it does not need proof");
}
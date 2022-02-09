import { CoinRecord, GetRecordsResponse } from "@/models/wallet";
import store from "@/store";
import puzzle from "./puzzle";
import { PuzzleDetail } from "./puzzle";
import utility from "./utility";
import { CustomCat } from "@/store/modules/account";

export interface TokenPuzzleDetail {
  symbol: string;
  puzzles: PuzzleDetail[];
}

class Receive {
  async getAssetsRequestDetail(sk_hex: string, maxId: number, customCats: CustomCat[]): Promise<TokenPuzzleDetail[]> {

    const privkey = utility.fromHexString(sk_hex);
    const xchToken = { symbol: "XCH", puzzles: await puzzle.getPuzzleDetails(privkey, 0, maxId) };
    const tokens: TokenPuzzleDetail[] = [xchToken];
    const standardAssets = Object.values(store.state.account.tokenInfo)
      .filter(_ => _.id)
      .map(_ => ({ symbol: _.symbol, id: _.id ?? "" }));
    const accountAssets = (customCats ?? []).map(_ => ({ symbol: _.name, id: _.id }))
    const assets = standardAssets.concat(accountAssets);

    for (let i = 0; i < assets.length; i++) {
      const assetId = assets[i].id;
      const ps = await puzzle.getCatPuzzleDetails(privkey, assetId, 0, maxId);
      tokens.push(Object.assign({}, assets[i], { puzzles: ps }));
    }

    return tokens;
  }

  async getCoinRecords(tokens: TokenPuzzleDetail[]): Promise<CoinRecord[]> {
    const dictAssets: { [key: string]: string } = {};
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      for (let j = 0; j < t.puzzles.length; j++) {
        const p = t.puzzles[j];
        dictAssets[p.hash] = t.symbol
      }
    }

    const hashes = tokens.reduce((acc, token) => acc.concat(token.puzzles.map(_ => _.hash)), ([] as string[]));

    const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/records", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        puzzleHashes: hashes,
        includeSpentCoins: true,
      }),
    });
    const json = (await resp.json()) as GetRecordsResponse;
    const activities = json.coins.reduce(
      (acc, puzzle) => acc.concat(puzzle.records
        .reduce<CoinRecord[]>((recacc, rec) => recacc.concat(rec), [])
        .map(rec => Object.assign({}, rec, { symbol: dictAssets[puzzle.puzzleHash] }))),
      ([] as CoinRecord[]));

    return activities;
  }
}

export default new Receive();


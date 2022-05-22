import { CoinRecord, GetRecordsResponse } from "@/models/wallet";
import store from "@/store";
import puzzle, { PuzzleAddress } from "./puzzle";
import { PuzzleDetail } from "./puzzle";
import utility from "./utility";
import { AccountTokenAddress, AccountTokens, CustomCat } from "@/store/modules/account";
import { rpcUrl, xchSymbol } from "@/store/modules/network";
import { prefix0x } from "../coin/condition";

export interface TokenPuzzleDetail {
  symbol: string;
  puzzles: PuzzleDetail[];
}

export interface TokenPuzzleAddress {
  symbol: string;
  puzzles: PuzzleAddress[];
}

class Receive {
  async getAssetsRequestDetail(sk_hex: string, maxId: number, customCats: CustomCat[]): Promise<TokenPuzzleDetail[]> {

    const privkey = utility.fromHexString(sk_hex);
    const xchToken = { symbol: xchSymbol(), puzzles: await puzzle.getPuzzleDetails(privkey, 0, maxId) };
    const tokens: TokenPuzzleDetail[] = [xchToken];
    const standardAssets = Object.values(store.state.account.tokenInfo)
      .filter(_ => _.id)
      .map(_ => ({ symbol: _.symbol, id: _.id ?? "" }));
    const accountAssets = (customCats ?? []).map(_ => ({ symbol: _.name, id: _.id }));
    const assets = standardAssets.concat(accountAssets);

    for (let i = 0; i < assets.length; i++) {
      const assetId = assets[i].id;
      const ps = await puzzle.getCatPuzzleDetails(privkey, assetId, 0, maxId);
      tokens.push(Object.assign({}, assets[i], { puzzles: ps }));
    }

    return tokens;
  }

  async getCoinRecords(tokens: TokenPuzzleAddress[], includeSpentCoins: boolean): Promise<GetRecordsResponse> {
    const hashes = tokens.reduce((acc, token) => acc.concat(token.puzzles.map(_ => _.hash)), ([] as string[]));

    const resp = await fetch(rpcUrl() + "Wallet/records", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        puzzleHashes: hashes,
        includeSpentCoins,
      }),
    });
    const json = (await resp.json()) as GetRecordsResponse;
    return json;
  }

  getAssetsDict(requests: TokenPuzzleAddress[]): { [key: string]: string } {
    const dictAssets: { [key: string]: string } = {};
    for (let i = 0; i < requests.length; i++) {
      const t = requests[i];
      for (let j = 0; j < t.puzzles.length; j++) {
        const p = t.puzzles[j];
        dictAssets[p.hash] = t.symbol
      }
    }
    return dictAssets;
  }

  async getActivities(tokens: TokenPuzzleAddress[], includeSpentCoins: boolean): Promise<CoinRecord[]> {
    const records = (await this.getCoinRecords(tokens, includeSpentCoins));
    const activities = this.convertActivities(tokens, records);
    return activities;
  }

  convertActivities(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): CoinRecord[] {
    const dictAssets = this.getAssetsDict(tokens);

    const activities = records.coins.reduce(
      (acc, puzzle) => acc.concat(puzzle.records
        .reduce<CoinRecord[]>((recacc, rec) => recacc.concat(rec), [])
        .map(rec => Object.assign({}, rec, { symbol: dictAssets[puzzle.puzzleHash] }))),
      ([] as CoinRecord[]))
      .sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  }

  getTokenBalance(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): AccountTokens {
    const dictAssets = this.getAssetsDict(tokens);

    const tokenBalances: AccountTokens = {};
    for (let i = 0; i < records.coins.length; i++) {
      const b = records.coins[i];
      const symbol = dictAssets[b.puzzleHash];
      const token = tokens.find(_ => _.symbol == symbol);
      if (!token) continue;
      if (!tokenBalances[symbol]) tokenBalances[symbol] = {
        amount: 0n,
        addresses: token.puzzles
          .map<AccountTokenAddress>(_ => ({
            address: _.address,
            coins: b.records.filter(r => r.coin?.puzzleHash == prefix0x(_.hash)),
          })),
      };
      tokenBalances[symbol].amount = tokenBalances[symbol].amount + BigInt(b.balance);
    }

    return tokenBalances;
  }
}

export default new Receive();


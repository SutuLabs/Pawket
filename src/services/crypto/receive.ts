import { CoinRecord, convertToOriginCoin, GetRecordsResponse, OriginCoin } from "@/models/wallet";
import puzzle, { PuzzleAddress } from "./puzzle";
import { PuzzleDetail } from "./puzzle";
import utility from "./utility";
import { CustomCat, AccountTokens, AccountTokenAddress, TokenInfo } from "@/models/account";
import { analyzeNftCoin, NftCoinAnalysisResult } from "../coin/nft";

export interface TokenPuzzleDetail {
  symbol: string;
  puzzles: PuzzleDetail[];
}

export interface TokenPuzzleAddress {
  symbol: string;
  puzzles: PuzzleAddress[];
}

export interface NftDetail {
  metadata: {
    uri: string;
    hash: string;
    collection?: string;
    name?: string;
  }
  hintPuzzle: string;
  coin: OriginCoin;
  analysis: NftCoinAnalysisResult;
}

class Receive {
  async getAssetsRequestDetail(sk_hex: string, maxId: number, customCats: CustomCat[], tokenInfo: TokenInfo, prefix: string, symbol: string): Promise<TokenPuzzleDetail[]> {

    const privkey = utility.fromHexString(sk_hex);
    const xchToken = { symbol, puzzles: await puzzle.getPuzzleDetails(privkey, prefix, 0, maxId) };
    const tokens: TokenPuzzleDetail[] = [xchToken];
    const standardAssets = Object.values(tokenInfo)
      .filter(_ => _.id)
      .map(_ => ({ symbol: _.symbol, id: _.id ?? "" }));
    const accountAssets = (customCats ?? []).map(_ => ({ symbol: _.name, id: _.id }));
    const assets = standardAssets.concat(accountAssets);

    for (let i = 0; i < assets.length; i++) {
      const assetId = assets[i].id;
      const ps = await puzzle.getCatPuzzleDetails(privkey, assetId, prefix, 0, maxId);
      tokens.push(Object.assign({}, assets[i], { puzzles: ps }));
    }

    return tokens;
  }

  async getCoinRecords(tokens: TokenPuzzleAddress[], includeSpentCoins: boolean, rpcUrl: string, hint = false): Promise<GetRecordsResponse> {
    const hashes = tokens.reduce((acc, token) => acc.concat(token.puzzles.map(_ => _.hash)), ([] as string[]));

    const resp = await fetch(rpcUrl + "Wallet/records", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        puzzleHashes: hashes,
        includeSpentCoins,
        hint,
      }),
    });
    const json = (await resp.json()) as GetRecordsResponse;
    return json;
  }

  getAssetsDict(requests: TokenPuzzleAddress[]): { [key: string]: { symbol: string, puzzle: PuzzleAddress } } {
    const dictAssets: { [key: string]: { symbol: string, puzzle: PuzzleAddress } } = {};
    for (let i = 0; i < requests.length; i++) {
      const t = requests[i];
      for (let j = 0; j < t.puzzles.length; j++) {
        const p = t.puzzles[j];
        dictAssets[p.hash] = { symbol: t.symbol, puzzle: p };
      }
    }
    return dictAssets;
  }

  async getActivities(tokens: TokenPuzzleAddress[], includeSpentCoins: boolean, rpcUrl: string): Promise<CoinRecord[]> {
    const records = (await this.getCoinRecords(tokens, includeSpentCoins, rpcUrl));
    const activities = this.convertActivities(tokens, records);
    return activities;
  }

  convertActivities(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): CoinRecord[] {
    const dictAssets = this.getAssetsDict(tokens);

    const activities = records.coins.reduce(
      (acc, puzzle) => acc.concat(puzzle.records
        .reduce<CoinRecord[]>((recacc, rec) => recacc.concat(rec), [])
        .map(rec => Object.assign({}, rec, { symbol: dictAssets[puzzle.puzzleHash].symbol }))),
      ([] as CoinRecord[]))
      .sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  }

  getTokenBalance(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): AccountTokens {
    const dictAssets = this.getAssetsDict(tokens);

    const tokenBalances: AccountTokens = {};

    for (let i = 0; i < tokens.length; i++) {
      const symbol = tokens[i].symbol;
      tokenBalances[symbol] = {
        amount: records.coins.filter(_ => dictAssets[_.puzzleHash].symbol == symbol).reduce((pv, cur) => pv + BigInt(cur.balance), 0n),
        addresses: tokens[i].puzzles
          .map<AccountTokenAddress>(_ => ({
            address: _.address,
            type: dictAssets[_.hash].puzzle.type,
            coins: (records.coins.find(c => _.hash == c.puzzleHash) || { records: [] }).records,
          })),
      };
    }

    return tokenBalances;
  }

  async getNfts(records: GetRecordsResponse, rpcUrl: string): Promise<NftDetail[]> {
    const nftList: NftDetail[] = [];
    for (let i = 0; i < records.coins.length; i++) {
      const coinRecords = records.coins[i];

      for (let j = 0; j < coinRecords.records.length; j++) {
        const coinRecord = coinRecords.records[j];

        if (!coinRecord.coin?.parentCoinInfo) {
          console.warn("coin cannot record", coinRecord);
          continue;
        }

        const result = await analyzeNftCoin(coinRecord.coin.parentCoinInfo, coinRecords.puzzleHash, rpcUrl);
        if (result) {
          nftList.push({
            metadata: result.metadata,
            hintPuzzle: coinRecords.puzzleHash,
            coin: convertToOriginCoin(coinRecord.coin),
            analysis: result,
          });
        }
      }
    }

    return nftList;
  }
}

export default new Receive();


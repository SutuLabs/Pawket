import { CoinRecord, GetRecordsResponse } from "../../models/wallet";
import puzzle, { PuzzleAddress, PuzzleDetail, PuzzleObserver, PuzzlePrivateKey } from "./puzzle";
import utility from "./utility";
import { CustomCat, AccountTokens, AccountTokenAddress, TokenInfo } from "../../models/account";
import { analyzeNftCoin, getScalarString } from "../coin/nft";
import debug from "../api/debug";
import { analyzeDidCoin, DidCoinAnalysisResult } from "../coin/did";
import { NftCoinAnalysisResult, CnsCoinAnalysisResult } from "../../models/nft";
import { CoinSpend, OriginCoin } from "../spendbundle";
import { convertToOriginCoin, getCoinName0x } from "../coin/coinUtility";
import { Hex0x, prefix0x } from "../coin/condition";
import { getLineageProofPuzzle } from "../transfer/call";

export interface TokenPuzzleDetail {
  symbol: string;
  puzzles: PuzzleDetail[];
}

export interface TokenPuzzlePrivateKey {
  symbol: string;
  puzzles: PuzzlePrivateKey[];
}

export interface TokenPuzzleObserver {
  symbol: string;
  puzzles: PuzzleObserver[];
}

export interface TokenPuzzleAddress {
  symbol: string;
  puzzles: PuzzleAddress[];
}

export interface CnsDetail {
  metadata: {
    uri: string;
    hash: string;
    collection?: string;
    name?: string;
  };
  hintPuzzle: string;
  coin: OriginCoin;
  address: string;
  analysis: CnsCoinAnalysisResult;
}

export interface NftDetail {
  metadata: {
    uri: string;
    hash: string;
    collection?: string;
    name?: string;
  };
  hintPuzzle: string;
  coin: OriginCoin;
  address: string;
  analysis: NftCoinAnalysisResult | CnsCoinAnalysisResult;
}

export interface DidDetail {
  name: string;
  did: string;
  hintPuzzle: string;
  coin: OriginCoin;
  analysis: DidCoinAnalysisResult;
}

export interface AssetsList {
  nfts: NftDetail[];
  dids: DidDetail[];
}

export type CoinClassType = "CatV2" | "DidV1" | "NftV1";

export type OptionalOneFoundParameterType = { did?: DidDetail; nft?: NftDetail };

const coinSolutions = new Map<string, CoinSpend>();

class Receive {
  async getAssetsRequestDetail(
    sk_hex: string,
    startId: number,
    maxId: number,
    customCats: CustomCat[],
    tokenInfo: TokenInfo,
    prefix: string,
    symbol: string,
    catModName: "cat_v1" | "cat_v2"
  ): Promise<TokenPuzzleDetail[]> {
    const privkey = utility.fromHexString(sk_hex);
    const xchToken = { symbol, puzzles: await puzzle.getPuzzleDetails(privkey, prefix, startId, maxId) };
    const tokens: TokenPuzzleDetail[] = [xchToken];
    const standardAssets = Object.values(tokenInfo)
      .filter((_) => _.id)
      .map((_) => ({ symbol: _.symbol, id: _.id ?? "" }));
    const accountAssets = (customCats ?? []).map((_) => ({ symbol: _.name, id: _.id }));
    const assets = standardAssets.concat(accountAssets);

    for (let i = 0; i < assets.length; i++) {
      const assetId = assets[i].id;
      const ps = await puzzle.getCatPuzzleDetails(privkey, assetId, prefix, startId, maxId, catModName);
      tokens.push(Object.assign({}, assets[i], { puzzles: ps }));
    }

    return tokens;
  }

  async getAssetsRequestObserver(
    pk_hex: Hex0x,
    startId: number,
    maxId: number,
    customCats: CustomCat[],
    tokenInfo: TokenInfo,
    prefix: string,
    symbol: string,
    catModName: "cat_v1" | "cat_v2"
  ): Promise<TokenPuzzleObserver[]> {
    const pubkey = utility.fromHexString(pk_hex);
    const xchToken = { symbol, puzzles: await puzzle.getPuzzleObservers(pubkey, prefix, startId, maxId) };
    const tokens: TokenPuzzleObserver[] = [xchToken];
    const standardAssets = Object.values(tokenInfo)
      .filter((_) => _.id)
      .map((_) => ({ symbol: _.symbol, id: _.id ?? "" }));
    const accountAssets = (customCats ?? []).map((_) => ({ symbol: _.name, id: _.id }));
    const assets = standardAssets.concat(accountAssets);

    for (let i = 0; i < assets.length; i++) {
      const assetId = assets[i].id;
      const ps = await puzzle.getCatPuzzleObservers(pubkey, assetId, prefix, startId, maxId, catModName);
      tokens.push(Object.assign({}, assets[i], { puzzles: ps }));
    }

    return tokens;
  }

  async getCoinRecords(
    tokens: TokenPuzzleAddress[],
    includeSpentCoins: boolean,
    rpcUrl: string,
    hint = false,
    coinType: CoinClassType | undefined = undefined
  ): Promise<GetRecordsResponse> {
    const hashes = tokens.reduce((acc, token) => acc.concat(token.puzzles.map((_) => _.hash)), [] as string[]);

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
        coinType,
      }),
    });
    if (resp.status != 200) {
      throw new Error('NETWORK_ERROR: ' + resp.status.toString())
    }
    const json = (await resp.json()) as GetRecordsResponse;
    return json;
  }

  getAssetsDict(requests: TokenPuzzleAddress[]): { [key: string]: { symbol: string; puzzle: PuzzleAddress } } {
    const dictAssets: { [key: string]: { symbol: string; puzzle: PuzzleAddress } } = {};
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
    const records = await this.getCoinRecords(tokens, includeSpentCoins, rpcUrl);
    const activities = this.convertActivities(tokens, records);
    return activities;
  }

  convertActivities(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): CoinRecord[] {
    const dictAssets = this.getAssetsDict(tokens);

    const activities = records.coins
      .reduce(
        (acc, puzzle) =>
          acc.concat(
            puzzle.records
              .reduce<CoinRecord[]>((recacc, rec) => recacc.concat(rec), [])
              .map((rec) => Object.assign({}, rec, { symbol: dictAssets[puzzle.puzzleHash].symbol }))
          ),
        [] as CoinRecord[]
      )
      .sort((a, b) => b.timestamp - a.timestamp);
    return activities;
  }

  getTokenBalance(tokens: TokenPuzzleAddress[], records: GetRecordsResponse): AccountTokens {
    const dictAssets = this.getAssetsDict(tokens);

    const tokenBalances: AccountTokens = {};

    for (let i = 0; i < tokens.length; i++) {
      const symbol = tokens[i].symbol;
      tokenBalances[symbol] = {
        amount: records.coins
          .filter((_) => dictAssets[_.puzzleHash].symbol == symbol)
          .reduce((pv, cur) => pv + BigInt(cur.balance), 0n),
        addresses: tokens[i].puzzles.map<AccountTokenAddress>((_) => ({
          address: _.address,
          type: dictAssets[_.hash].puzzle.type,
          coins: (records.coins.find((c) => _.hash == c.puzzleHash) || { records: [] }).records,
        })),
      };
    }

    return tokenBalances;
  }

  async getAssets(
    records: GetRecordsResponse,
    rpcUrl: string,
    oneFound: ((parameter: OptionalOneFoundParameterType) => void) | undefined = undefined
  ): Promise<AssetsList> {
    const nftList: NftDetail[] = [];
    const didList: DidDetail[] = [];
    for (let i = 0; i < records.coins.length; i++) {
      const coinRecords = records.coins[i];

      for (let j = 0; j < coinRecords.records.length; j++) {
        const coinRecord = coinRecords.records[j];

        if (!coinRecord.coin?.parentCoinInfo) {
          console.warn("coin cannot record", coinRecord);
          continue;
        }
        let scoin;
        const coinCache = coinSolutions.get(coinRecord.coin.parentCoinInfo);
        if (coinCache) {
          scoin = coinCache;
        } else {
          scoin = await debug.getCoinSolution(coinRecord.coin.parentCoinInfo, rpcUrl);
          coinSolutions.set(coinRecord.coin.parentCoinInfo, scoin);
        }
        const ocoin = convertToOriginCoin(coinRecord.coin);
        // console.log("analyzing", getCoinName0x(convertToOriginCoin(coinRecord.coin)));
        const nftResult = await analyzeNftCoin(scoin.puzzle_reveal, coinRecords.puzzleHash, ocoin, scoin.solution);
        if (nftResult) {
          const nft: NftDetail = {
            metadata: {
              uri: getScalarString(nftResult.metadata.imageUri) ?? "",
              hash: nftResult.metadata.imageHash ?? "",
            },
            hintPuzzle: coinRecords.puzzleHash,
            address: puzzle.getAddressFromPuzzleHash(nftResult.launcherId, "nft"),
            coin: convertToOriginCoin(coinRecord.coin),
            analysis: nftResult,
          };
          if (oneFound) oneFound({ nft });
          nftList.push(nft);
          continue;
        }

        const didResult = await analyzeDidCoin(scoin.puzzle_reveal, coinRecords.puzzleHash, ocoin, scoin.solution);
        if (didResult) {
          const did: DidDetail = {
            name: puzzle.getAddressFromPuzzleHash(didResult.launcherId, "did:chia:"),
            did: puzzle.getAddressFromPuzzleHash(didResult.launcherId, "did:chia:"),
            hintPuzzle: coinRecords.puzzleHash,
            coin: convertToOriginCoin(coinRecord.coin),
            analysis: didResult,
          };
          if (oneFound) oneFound({ did });
          didList.push(did);
          continue;
        }
      }
    }

    return { nfts: nftList, dids: didList };
  }

  async getSpentCoinPuzzle(puzzleHash: Hex0x, rpcUrl: string): Promise<Hex0x | undefined> {
    const records = await this.getCoinRecords([{ symbol: "", puzzles: [{ hash: puzzleHash, address: "" }] }], true, rpcUrl);
    const coins = records.coins.reduce((acc, token) => acc.concat(token.records), [] as CoinRecord[]);
    const firstSpentCoin = coins.filter(_ => _.spent).at(0);
    if (!firstSpentCoin || !firstSpentCoin.coin) return undefined;
    const coinName = getCoinName0x(convertToOriginCoin(firstSpentCoin.coin));
    const coin = await getLineageProofPuzzle(coinName, rpcUrl);
    if (!coin || !coin.puzzleReveal) return undefined;
    return prefix0x(coin.puzzleReveal);
  }
}

export default new Receive();

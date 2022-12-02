import { CoinItem, CoinRecord } from "@/models/wallet";
import { OriginCoin } from "@/services/spendbundle";
import store from "@/store";
import { prefix0x } from "../coin/condition";
import receive, { TokenPuzzleAddress, TokenPuzzleDetail, TokenPuzzleObserver } from "../crypto/receive";
import { getAccountCats } from "@/store/modules/account";
import { SymbolCoins } from "./transfer";
import { chainId, rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { AccountEntity } from "@/models/account";
import { coinFilter } from "../coin/coinUtility";
import { getAccountAddressDetails, getAccountPuzzleObservers } from "../util/account";


class CoinHandler {
  public async getAssetsRequestDetail(account: AccountEntity): Promise<TokenPuzzleDetail[]> {
    return await getAccountAddressDetails(
      account,
      getAccountCats(account),
      store.state.account.tokenInfo,
      xchPrefix(),
      xchSymbol()
    );
  }

  public async getAssetsRequestObserver(account: AccountEntity): Promise<TokenPuzzleObserver[]> {
    return await getAccountPuzzleObservers(
      account,
      getAccountCats(account),
      store.state.account.tokenInfo,
      xchPrefix(),
      xchSymbol()
    );
  }

  public async getAvailableCoins(requests: TokenPuzzleAddress[], tokenNames: string[]): Promise<SymbolCoins[]> {
    let coins = (await receive.getActivities(requests, false, rpcUrl()))
      .filter((_) => _.coin)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));

    const allcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});

    coins = coinFilter(coins, chainId())

    const availcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
    return [availcoins, allcoins];
  }

  public getAvailableCoinFromRecords(requests: TokenPuzzleAddress[], records: CoinRecord[], tokenNames: string[]): SymbolCoins[] {
    let coins = records
      .filter((_) => _.coin)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));
    const allcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});

    coins = coinFilter(coins, chainId())

    const availcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
    return [availcoins, allcoins];
  }

  getTokenNames(account: AccountEntity): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(getAccountCats(account).map((_) => _.name));
  }
}

export default new CoinHandler();

export function compareOriginCoin(a: OriginCoin, b: OriginCoin): boolean {
  return a.amount == b.amount && a.parent_coin_info == b.parent_coin_info && a.puzzle_hash == b.puzzle_hash;
}
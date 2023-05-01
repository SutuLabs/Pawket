import { CoinItem, CoinRecord } from "../../../../pawket-chia-lib/models/wallet";
import { OriginCoin } from "../../../../pawket-chia-lib/services/spendbundle";
import { prefix0x } from "../../../../pawket-chia-lib/services/coin/condition";
import receive, { TokenPuzzleAddress, TokenPuzzleDetail, TokenPuzzleObserver } from "../../../../pawket-chia-lib/services/crypto/receive";
import { getAccountCats } from "@/store/modules/account";
import { SymbolCoins } from "../../../../pawket-chia-lib/services/transfer/transfer";
import { chainId, rpcUrl, xchPrefix, xchSymbol } from "@/store/modules/network";
import { AccountEntity, TokenInfo } from "../../../../pawket-chia-lib/models/account";
import { coinFilter } from "../../../../pawket-chia-lib/services/coin/coinUtility";
import { getAccountAddressDetails, getAccountPuzzleObservers } from "../../../../pawket-chia-lib/services/util/account";


class CoinHandler {
  public async getAssetsRequestDetail(account: AccountEntity, tokenInfo: TokenInfo): Promise<TokenPuzzleDetail[]> {
    return await getAccountAddressDetails(
      account,
      getAccountCats(account),
      tokenInfo,
      xchPrefix(),
      xchSymbol()
    );
  }

  public async getAssetsRequestObserver(account: AccountEntity, tokenInfo: TokenInfo): Promise<TokenPuzzleObserver[]> {
    return await getAccountPuzzleObservers(
      account,
      getAccountCats(account),
      tokenInfo,
      xchPrefix(),
      xchSymbol()
    );
  }

  public async getAvailableCoins(account: AccountEntity, requests: TokenPuzzleAddress[], tokenNames: string[]): Promise<SymbolCoins> {
    let coins = (await receive.getActivities(requests, false, rpcUrl()))
      .filter((_) => _.coin)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));

    coins = coinFilter(account, coins, chainId())

    const availcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
    return availcoins;
  }

  public getAvailableCoinFromRecords(account: AccountEntity, requests: TokenPuzzleAddress[], records: CoinRecord[], tokenNames: string[]): SymbolCoins {
    let coins = records
      .filter((_) => _.coin)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));

    coins = coinFilter(account, coins, chainId())

    const availcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
    return availcoins;
  }

  getTokenNames(account: AccountEntity, tokenInfo: TokenInfo): string[] {
    return Object.keys(tokenInfo).concat(getAccountCats(account).map((_) => _.name));
  }
}

export default new CoinHandler();

export function compareOriginCoin(a: OriginCoin, b: OriginCoin): boolean {
  return a.amount == b.amount && a.parent_coin_info == b.parent_coin_info && a.puzzle_hash == b.puzzle_hash;
}
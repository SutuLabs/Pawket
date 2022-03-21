import { CoinItem } from "@/models/wallet";
import store from "@/store";
import { prefix0x } from "../coin/condition";
import receive, { TokenPuzzleDetail } from "../crypto/receive";
import { AccountEntity } from "@/store/modules/account";
import { SymbolCoins } from "./transfer";


class CoinHandler {

  public async getAssetsRequestDetail(account: AccountEntity): Promise<TokenPuzzleDetail[]> {
    const maxId = account.addressRetrievalCount;
    const sk_hex = account.key.privateKey;
    const requests = await receive.getAssetsRequestDetail(sk_hex, maxId, account.cats ?? []);
    return requests;
  }

  public async getAvailableCoins(requests: TokenPuzzleDetail[], tokenNames: string[]): Promise<SymbolCoins> {
    const coins = (await receive.getCoinRecords(requests, false))
      .filter((_) => _.coin)
      .map((_) => _.coin as CoinItem)
      .map((_) => ({
        amount: BigInt(_.amount),
        parent_coin_info: _.parentCoinInfo,
        puzzle_hash: _.puzzleHash,
      }));

    const availcoins = tokenNames
      .map((symbol) => {
        const tgtpuzs = requests.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
        return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
      })
      .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});

    return availcoins;
  }

  getTokenNames(account: AccountEntity): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(account.cats.map((_) => _.name));
  }

}


export default new CoinHandler();

import { AccountEntity } from "@/models/account";
import { TokenPuzzleAddress, TokenPuzzleDetail, TokenPuzzleObserver } from "../crypto/receive";
import { SymbolCoins } from "../transfer/transfer";
import coinHandler from "@/services/transfer/coin";
import store from "@/store";

export async function getAvailableCoins(account: AccountEntity): Promise<[SymbolCoins, SymbolCoins]> {
  return await coinHandler.getAvailableCoins(
    account,
    await coinHandler.getAssetsRequestObserver(account, store.state.account.tokenInfo),
    coinHandler.getTokenNames(account, store.state.account.tokenInfo)
  );
}

export async function getAvailableCoinsWithRequests(account: AccountEntity, requests: TokenPuzzleAddress[]): Promise<[SymbolCoins, SymbolCoins]> {
  return await coinHandler.getAvailableCoins(
    account,
    requests,
    coinHandler.getTokenNames(account, store.state.account.tokenInfo)
  );
}

export async function getAssetsRequestDetail(account: AccountEntity): Promise<TokenPuzzleDetail[]> {
  return account.type == "PublicKey"
    ? []
    : await coinHandler.getAssetsRequestDetail(account, store.state.account.tokenInfo);
}

export async function getAssetsRequestObserver(account: AccountEntity): Promise<TokenPuzzleObserver[]> {
  return await coinHandler.getAssetsRequestObserver(account, store.state.account.tokenInfo);
}
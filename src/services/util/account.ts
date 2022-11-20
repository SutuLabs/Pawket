import { AccountEntity, CustomCat, TokenInfo } from "@/models/account";
import receive, { TokenPuzzleDetail, TokenPuzzleObserver } from "../crypto/receive";

export const DEFAULT_ADDRESS_RETRIEVAL_COUNT = 4;

export async function getAccountAddressDetails(
  account: AccountEntity,
  cats: CustomCat[],
  tokenInfo: TokenInfo,
  prefix: string,
  symbol: string,
  maxId: number | undefined = undefined,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<TokenPuzzleDetail[]> {
  if (typeof maxId !== "number" || maxId <= 0) maxId = account.addressRetrievalCount;
  if (typeof maxId !== "number" || maxId <= 0) DEFAULT_ADDRESS_RETRIEVAL_COUNT;
  if (!account.key.privateKey)
    throw new Error("Private key cannot empty for non-pk account to get account addresses.");

  if (account.addressGenerated == maxId) {
    return account.addressPuzzles;
  }

  if (account.type == "PublicKey")
    throw new Error("Public Key accound cannot provide puzzle detail");

  account.addressPuzzles = await receive.getAssetsRequestDetail(account.key.privateKey, 0, maxId, cats, tokenInfo, prefix, symbol, catModName);
  account.addressGenerated = maxId;
  return account.addressPuzzles;
}

export async function getAccountPuzzleObservers(
  account: AccountEntity,
  cats: CustomCat[],
  tokenInfo: TokenInfo,
  prefix: string,
  symbol: string,
  maxId: number | undefined = undefined,
  catModName: "cat_v1" | "cat_v2" = "cat_v2",
): Promise<TokenPuzzleObserver[]> {
  if (typeof maxId !== "number" || maxId <= 0) maxId = account.addressRetrievalCount;
  if (typeof maxId !== "number" || maxId <= 0) DEFAULT_ADDRESS_RETRIEVAL_COUNT;

  if (account.addressGenerated == maxId) {
    return account.type == "PublicKey" ? (account.observePuzzles ?? []) : account.addressPuzzles;
  }

  if (account.type == "PublicKey") {
    if (!account.key.publicKey)
      throw new Error("public key cannot empty for pk account to get account addresses.");
    account.observePuzzles = await receive.getAssetsRequestObserver(account.key.publicKey, 0, maxId, cats, tokenInfo, prefix, symbol, catModName);
    account.addressGenerated = maxId;
    return account.observePuzzles;
  }
  else {
    if (!account.key.privateKey)
      throw new Error("Private key cannot empty for non-pk account to get account addresses.");
    account.addressPuzzles = await receive.getAssetsRequestDetail(account.key.privateKey, 0, maxId, cats, tokenInfo, prefix, symbol, catModName);
    account.addressGenerated = maxId;
    return account.addressPuzzles;
  }

}